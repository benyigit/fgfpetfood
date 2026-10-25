'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CatalogProduct, Variant } from '@/lib/catalog';

export type BagLine = {
  productId: string;
  variantId?: string;
  name: string;
  variantTitle?: string;
  image: string;
  quantity: number;
  price?: Variant['price'];
};

export const lineKey = (line: BagLine) => line.variantId || line.productId;

// A saved local pick can only become an orderable pack when the match is unique.
export function findBagProduct(products: CatalogProduct[], productId: string) {
  const matches = products.filter(p => p.id === productId || p.shopifyHandle === productId);
  return matches.length === 1 ? matches[0] : undefined;
}

export function resolveBagLines(lines: BagLine[], products: CatalogProduct[]) {
  return lines.map(line => {
    const product = findBagProduct(products, line.productId);
    const variant = line.variantId
      ? product?.variants.find(v => v.id === line.variantId)
      : product?.variants.length === 1 ? product.variants[0] : undefined;
    return { line, product, variant };
  });
}

export function validPrice(price: Variant['price'] | undefined): price is Variant['price'] {
  return !!price && typeof price.amount === 'string' && price.amount.trim() !== ''
    && Number.isFinite(Number(price.amount)) && Number(price.amount) >= 0
    && typeof price.currencyCode === 'string' && /^[A-Z]{3}$/.test(price.currencyCode);
}

function readSavedBag(value: string | null): BagLine[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.flatMap((item): BagLine[] => {
      if (!item || typeof item !== 'object' || typeof item.productId !== 'string'
        || typeof item.name !== 'string' || !Number.isInteger(item.quantity)
        || item.quantity < 1 || item.quantity > 20) return [];
      const line: BagLine = {
        productId: item.productId.slice(0, 300),
        name: item.name.slice(0, 300),
        image: typeof item.image === 'string' ? item.image : '',
        quantity: item.quantity,
        variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
        variantTitle: typeof item.variantTitle === 'string' ? item.variantTitle.slice(0, 300) : undefined,
      };
      if (!line.productId || seen.has(lineKey(line))) return [];
      seen.add(lineKey(line));
      return [line];
    }).slice(0, 50);
  } catch {
    return [];
  }
}

const Context = createContext<{
  lines: BagLine[];
  hydrated: boolean;
  add: (product: CatalogProduct, variant?: Variant, quantity?: number) => boolean;
  change: (key: string, quantity: number) => void;
  reconcile: (products: CatalogProduct[]) => void;
}>({ lines: [], hydrated: false, add: () => false, change() {}, reconcile() {} });

export function CommerceProvider({ children, brand }: { children: ReactNode; brand: string }) {
  const key = `${brand}-treat-bag`;
  const [lines, setLines] = useState<BagLine[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const hydrated = loadedKey === key;

  useEffect(() => {
    try {
      setLines(readSavedBag(localStorage.getItem(key)));
    } catch {
      setLines([]);
    }
    setLoadedKey(key);
    const sync = (event: StorageEvent) => {
      if (event.key === key) setLines(readSavedBag(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem(key, JSON.stringify(lines)); } catch {}
    }
  }, [key, lines, hydrated]);

  const add = useCallback((product: CatalogProduct, variant?: Variant, quantity = 1) => {
    if (!hydrated || (product.connected && (!variant?.availableForSale || !validPrice(variant.price)
      || !product.variants.some(v => v.id === variant.id)))) return false;
    const count = Number.isInteger(quantity) ? Math.max(1, Math.min(20, quantity)) : 1;
    const item: BagLine = {
      productId: product.id,
      variantId: variant?.id,
      variantTitle: variant?.title,
      name: product.name,
      image: product.media[0]?.src || product.image || '',
      quantity: count,
    };
    if (lines.length >= 50 && !lines.some(line => lineKey(line) === lineKey(item))) return false;
    setLines(previous => {
      const found = previous.some(line => lineKey(line) === lineKey(item));
      if (!found && previous.length >= 50) return previous;
      return found ? previous.map(line => lineKey(line) === lineKey(item)
        ? { ...item, quantity: Math.min(20, line.quantity + count) } : line) : [...previous, item];
    });
    return true;
  }, [hydrated, lines]);

  const change = useCallback((key: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    setLines(previous => previous.map(line => lineKey(line) === key
      ? { ...line, quantity: Math.max(0, Math.min(20, quantity)) } : line).filter(line => line.quantity > 0));
  }, []);

  const reconcile = useCallback((products: CatalogProduct[]) => {
    setLines(previous => {
      const next = new Map<string, BagLine>();
      for (const { line, product, variant } of resolveBagLines(previous, products)) {
        const updated = product ? {
          ...line,
          productId: product.id,
          name: product.name,
          image: product.media[0]?.src || product.image || line.image,
          variantId: variant?.id || line.variantId,
          variantTitle: variant?.title || line.variantTitle,
        } : line;
        const existing = next.get(lineKey(updated));
        next.set(lineKey(updated), existing
          ? { ...updated, quantity: Math.min(20, existing.quantity + updated.quantity) } : updated);
      }
      const updated = [...next.values()];
      return JSON.stringify(previous) === JSON.stringify(updated) ? previous : updated;
    });
  }, []);

  return <Context.Provider value={{ lines, hydrated, add, change, reconcile }}>{children}</Context.Provider>;
}

export const useBag = () => useContext(Context);
