'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CatalogProduct, Variant } from '@/lib/catalog';
type Line = {
  productId: string;
  variantId?: string;
  name: string;
  variantTitle?: string;
  image: string;
  quantity: number;
  price?: Variant['price'];
};
const Context = createContext<{
  lines: Line[];
  add: (p: CatalogProduct, v?: Variant, quantity?: number) => void;
  change: (key: string, qty: number) => void;
}>({
  lines: [],
  add() {},
  change() {}
});
export const lineKey = (l: Line) => l.variantId || l.productId;
export function CommerceProvider({
  children,
  brand
}: {
  children: ReactNode;
  brand: string;
}) {
  const key = `${brand}-treat-bag`;
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(value)) setLines(value.filter(l => typeof l.productId === 'string' && typeof l.name === 'string' && Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= 20).slice(0, 50));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) try {
      localStorage.setItem(key, JSON.stringify(lines));
    } catch {}
  }, [key, lines, ready]);
  const add = (p: CatalogProduct, v?: Variant, quantity = 1) => setLines(prev => {
    const item: Line = {
      productId: p.id,
      variantId: v?.id,
      variantTitle: v?.title,
      name: p.name,
      image: p.media[0]?.src || '',
      quantity,
      price: v?.price
    };
    const found = prev.some(l => lineKey(l) === lineKey(item));
    return found ? prev.map(l => lineKey(l) === lineKey(item) ? {
      ...l,
      quantity: Math.min(20, l.quantity + quantity)
    } : l) : [...prev, item];
  });
  return <Context.Provider value={{
    lines,
    add,
    change: (id, qty) => setLines(prev => prev.map(l => lineKey(l) === id ? {
      ...l,
      quantity: Math.max(0, Math.min(20, qty))
    } : l).filter(l => l.quantity > 0))
  }}>{children}</Context.Provider>;
}
export const useBag = () => useContext(Context);
