import 'server-only';
import { isIP } from 'node:net';
import { cache } from 'react';
import { localCatalog, type CatalogProduct, type Media, type Variant } from './catalog';
import productMap from '@/data/shopify-product-map.json';

const API_VERSION = '2026-10';
const UNAVAILABLE = 'The shop is temporarily unavailable. Please try again in a moment.';
export type CheckoutLine = { merchandiseId: string; quantity: number };
type CartWarning = { code: string; message: string; target: string };
export class ShopError extends Error {
  constructor(
    message: string,
    public status = 503,
    public code = 'SHOP_UNAVAILABLE',
    public details?: { warnings?: CartWarning[]; lines?: CheckoutLine[] }
  ) {
    super(message);
    this.name = 'ShopError';
  }
}
class ProductTagsUnavailable extends ShopError {}

function config() {
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || '').trim().toLowerCase().replace(/^https:\/\//, '').replace(/\/$/, '');
  const privateToken = (process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN || '').trim();
  const publicToken = (process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '').trim();
  return { domain, privateToken, publicToken };
}
export const shopConnected = () => {
  const { domain, privateToken, publicToken } = config();
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain) && !!(privateToken || publicToken);
};

// Vercel supplies this header; never trust a browser-supplied IP in a request body.
export function buyerIP(headers: { get(name: string): string | null }): string | undefined {
  if (process.env.VERCEL !== '1') return undefined;
  const value = (headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return isIP(value) ? value : undefined;
}

async function query<T>(document: string, variables: object = {}, ip?: string): Promise<T> {
  if (!shopConnected()) throw new ShopError('Online checkout is not available yet.', 503, 'SHOP_NOT_CONNECTED');
  const { domain, privateToken, publicToken } = config();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (privateToken) {
    headers['Shopify-Storefront-Private-Token'] = privateToken;
    if (ip && isIP(ip)) headers['Shopify-Storefront-Buyer-IP'] = ip;
  } else {
    headers['X-Shopify-Storefront-Access-Token'] = publicToken;
  }
  try {
    const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: 'POST', headers,
      body: JSON.stringify({ query: document, variables }),
      cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new ShopError(UNAVAILABLE);
    const body = await res.json() as {
      data?: T;
      errors?: { message?: string; path?: (string | number)[]; extensions?: { code?: string } }[];
    };
    if (body.errors?.length) {
      const onlyTagPermissions = body.errors.every(error => error.extensions?.code === 'ACCESS_DENIED' &&
        (error.path?.includes('tags') || /\btags\b/i.test(error.message || '')));
      if (onlyTagPermissions) throw new ProductTagsUnavailable(UNAVAILABLE);
      throw new ShopError(UNAVAILABLE);
    }
    if (!body.data) throw new ShopError(UNAVAILABLE);
    return body.data;
  } catch (error) {
    if (error instanceof ShopError) throw error;
    throw new ShopError(UNAVAILABLE);
  }
}

type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type Connection<T> = { nodes: T[]; pageInfo: PageInfo };
type Remote = {
  id: string; handle: string; title: string; description: string; productType: string; tags?: string[];
  images: { nodes: { url: string; altText: string | null }[] };
  variants: Connection<Variant>;
};
const variantFields = 'id title availableForSale price { amount currencyCode }';

function uniqueMedia(items: Media[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.src) return false;
    const key = `${item.type}:${item.src}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// React cache only deduplicates a server render, so prices and availability remain live.
export const getCatalog = cache(async (ip?: string): Promise<CatalogProduct[]> => {
  const locals = localCatalog();
  if (!shopConnected()) return locals;
  const all: Remote[] = [];
  let cursor: string | null = null;
  let includeTags = true;
  const seenCursors = new Set<string>();
  const readPage = (after: string | null): Promise<{ products: Connection<Remote> }> => query<{ products: Connection<Remote> }>(`query Products($cursor:String) {
    products(first:50, after:$cursor) {
      nodes { id handle title description productType ${includeTags ? 'tags' : ''} images(first:50) { nodes { url altText } }
        variants(first:100) { nodes { ${variantFields} } pageInfo { hasNextPage endCursor } }
      } pageInfo { hasNextPage endCursor }
    }
  }`, { cursor: after }, ip);
  do {
    let page: { products: Connection<Remote> };
    try {
      page = await readPage(cursor);
    } catch (error) {
      if (!(error instanceof ProductTagsUnavailable) || !includeTags) throw error;
      // Tags are optional when explicit product IDs or exact handles provide the match.
      includeTags = false;
      page = await readPage(cursor);
    }
    all.push(...page.products.nodes);
    cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
    if (page.products.pageInfo.hasNextPage && (!cursor || seenCursors.has(cursor))) throw new ShopError(UNAVAILABLE);
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  for (const product of all) {
    let variantCursor = product.variants.pageInfo.hasNextPage ? product.variants.pageInfo.endCursor : null;
    if (product.variants.pageInfo.hasNextPage && !variantCursor) throw new ShopError(UNAVAILABLE);
    const seen = new Set<string>();
    while (variantCursor) {
      if (seen.has(variantCursor)) throw new ShopError(UNAVAILABLE);
      seen.add(variantCursor);
      const more: { product: { variants: Connection<Variant> } | null } = await query<{ product: { variants: Connection<Variant> } | null }>(`query MoreVariants($id:ID!, $cursor:String!) {
        product(id:$id) { variants(first:100, after:$cursor) { nodes { ${variantFields} } pageInfo { hasNextPage endCursor } } }
      }`, { id: product.id, cursor: variantCursor }, ip);
      if (!more.product) throw new ShopError(UNAVAILABLE);
      product.variants.nodes.push(...more.product.variants.nodes);
      variantCursor = more.product.variants.pageInfo.hasNextPage ? more.product.variants.pageInfo.endCursor : null;
      if (more.product.variants.pageInfo.hasNextPage && !variantCursor) throw new ShopError(UNAVAILABLE);
    }
  }

  const matchedLocalIds = new Set<string>();
  const usedIds = new Set<string>();
  const storeMap = (productMap as Record<string, Record<string, string>>)[config().domain] || {};
  const connected = all.map(p => {
    const mappedId = storeMap[p.id];
    const mappedLocal = locals.find(l => l.id === mappedId);
    if (mappedId && !mappedLocal) throw new ShopError(UNAVAILABLE, 503, 'CATALOG_MAPPING_INVALID');
    const taggedIds = [...new Set((p.tags || []).filter(t => t.startsWith('catalog:')).map(t => t.slice(8)))];
    const matches = locals.filter(l => taggedIds.includes(l.id));
    if (!mappedLocal && matches.length > 1) throw new ShopError(UNAVAILABLE, 503, 'CATALOG_MAPPING_AMBIGUOUS');
    const local = mappedLocal || matches[0] || (!taggedIds.length ? locals.find(l => l.id === p.handle) : undefined);
    const id = local?.id || p.handle;
    if (usedIds.has(id)) throw new ShopError(UNAVAILABLE, 503, 'CATALOG_MAPPING_AMBIGUOUS');
    usedIds.add(id);
    if (local) matchedLocalIds.add(local.id);
    const remoteMedia: Media[] = p.images.nodes.map(im => ({ type: 'image', src: im.url, label: im.altText || p.title, origin: 'original' }));
    return {
      id, shopifyHandle: p.handle, shopifyProductId: p.id,
      name: p.title, kind: p.productType || local?.kind || 'DOG TREATS', group: local?.group || 'other',
      image: p.images.nodes[0]?.url || local?.image || '',
      description: p.description || local?.description || '', details: local?.details,
      media: uniqueMedia([...remoteMedia, ...(local?.media || [])]),
      variants: p.variants.nodes, connected: true
    } satisfies CatalogProduct;
  });
  // Keep established links and package details available until an explicit Shopify match exists.
  return [...connected, ...locals.filter(p => !matchedLocalIds.has(p.id) && !usedIds.has(p.id))];
});

export function validateCheckoutLines(value: unknown): CheckoutLine[] {
  if (!Array.isArray(value) || !value.length || value.length > 50) {
    throw new ShopError('Please check the items in your bag.', 400, 'INVALID_BAG');
  }
  const grouped = new Map<string, number>();
  for (const valueLine of value) {
    if (!valueLine || typeof valueLine !== 'object') throw new ShopError('Please check the items in your bag.', 400, 'INVALID_BAG');
    const { merchandiseId, quantity } = valueLine as Partial<CheckoutLine>;
    if (typeof merchandiseId !== 'string' || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(merchandiseId) ||
      typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new ShopError('Please check the items and quantities in your bag.', 400, 'INVALID_BAG');
    }
    const total = (grouped.get(merchandiseId) || 0) + quantity;
    if (total > 20) throw new ShopError('Please choose no more than 20 packs of each item.', 400, 'INVALID_BAG');
    grouped.set(merchandiseId, total);
  }
  return [...grouped].map(([merchandiseId, quantity]) => ({ merchandiseId, quantity }));
}

export async function checkout(input: CheckoutLine[], ip?: string): Promise<string> {
  const lines = validateCheckoutLines(input);
  const data = await query<{
    cartCreate: {
      cart: { checkoutUrl: string; totalQuantity: number; lines: Connection<{ quantity: number; merchandise: { id: string } }> } | null;
      userErrors: { code: string | null; field: string[] | null; message: string }[];
      warnings: CartWarning[];
    }
  }>(`mutation Cart($input:CartInput!) {
    cartCreate(input:$input) {
      cart { checkoutUrl totalQuantity lines(first:250) { nodes { quantity merchandise { ... on ProductVariant { id } } } pageInfo { hasNextPage endCursor } } }
      userErrors { code field message }
      warnings { code message target }
    }
  }`, { input: { lines } }, ip);
  const { cart, userErrors, warnings } = data.cartCreate;
  if (userErrors.length) throw new ShopError(userErrors[0].message, 409, 'CART_REJECTED');
  if (!cart) throw new ShopError('Your checkout could not be opened. Please try again.');
  const actualLines = cart.lines.nodes.map(line => ({ merchandiseId: line.merchandise.id, quantity: line.quantity }));
  const actualQuantities = new Map<string, number>();
  for (const line of actualLines) actualQuantities.set(line.merchandiseId, (actualQuantities.get(line.merchandiseId) || 0) + line.quantity);
  const unchanged = !cart.lines.pageInfo.hasNextPage && actualQuantities.size === lines.length &&
    lines.every(line => actualQuantities.get(line.merchandiseId) === line.quantity) &&
    cart.totalQuantity === lines.reduce((total, line) => total + line.quantity, 0);
  if (!unchanged || warnings.length) {
    throw new ShopError(
      warnings[0]?.message || 'Some items or quantities are no longer available. Please review your bag before continuing.',
      409, 'CART_CHANGED', { warnings, lines: actualLines }
    );
  }
  // Use only Shopify's freshly returned URL; never build a checkout URL from product handles.
  let url: URL;
  try { url = new URL(cart.checkoutUrl); } catch { throw new ShopError(UNAVAILABLE); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new ShopError(UNAVAILABLE);
  return url.toString();
}
