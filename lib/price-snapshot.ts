import snapshots from '@/data/shopify-price-snapshot.json';
import productMap from '@/data/shopify-product-map.json';

/** Display-only evidence from the merchant admin, never checkout merchandise. */
export type PriceSnapshot = {
  amount: string;
  currencyCode: string;
  verifiedAt: string;
  shopifyProductId: string;
  variantTitle?: string;
};

export const PRICE_SNAPSHOT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const STORE_DOMAIN = 'sn12b8-ng.myshopify.com';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function validPriceSnapshot(value: unknown, now = Date.now()): value is PriceSnapshot {
  if (!record(value) || typeof value.amount !== 'string' || !/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value.amount)
    || typeof value.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(value.currencyCode)
    || typeof value.shopifyProductId !== 'string' || !/^gid:\/\/shopify\/Product\/\d+$/.test(value.shopifyProductId)
    || typeof value.verifiedAt !== 'string'
    || (value.variantTitle !== undefined && (typeof value.variantTitle !== 'string' || !value.variantTitle.trim() || value.variantTitle.length > 200))) return false;
  const checkedAt = Date.parse(value.verifiedAt);
  if (!Number.isFinite(checkedAt) || new Date(checkedAt).toISOString() !== value.verifiedAt
    || checkedAt > now || now - checkedAt >= PRICE_SNAPSHOT_MAX_AGE) return false;
  try { new Intl.NumberFormat('en-US', { style: 'currency', currency: value.currencyCode }).format(Number(value.amount)); }
  catch { return false; }
  return true;
}

export function localPriceSnapshot(localId: string, now = Date.now()): PriceSnapshot | undefined {
  const data: unknown = snapshots;
  if (!record(data) || data.storeDomain !== STORE_DOMAIN || !record(data.products)) return undefined;
  const mapping = (productMap as Record<string, Record<string, string>>)[STORE_DOMAIN] || {};
  const matches = Object.entries(mapping).filter(([, mappedId]) => mappedId === localId);
  if (matches.length !== 1) return undefined;
  const shopifyProductId = matches[0][0];
  const entry = data.products[shopifyProductId];
  if (!record(entry)) return undefined;
  const snapshot = { ...entry, shopifyProductId };
  return validPriceSnapshot(snapshot, now) ? snapshot : undefined;
}
