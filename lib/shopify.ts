import 'server-only';
import { localCatalog, type CatalogProduct, type Variant } from './catalog';
const domain = process.env.SHOPIFY_STORE_DOMAIN || '';
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
export const shopConnected = () => /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain) && !!token;
async function query<T>(query: string, variables: object = {}): Promise<T> {
  if (!shopConnected()) throw new Error('The shop is not open yet.');
  const res = await fetch(`https://${domain}/api/2026-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token
    },
    body: JSON.stringify({
      query,
      variables
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000)
  });
  const body = await res.json();
  if (!res.ok || body.errors || !body.data) throw new Error('The shop is temporarily unavailable. Please try again.');
  return body.data as T;
}
type Remote = {
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  images: {
    nodes: {
      url: string;
      altText: string | null;
    }[];
  };
  variants: {
    nodes: Variant[];
  };
};
export async function getCatalog(): Promise<CatalogProduct[]> {
  const locals = localCatalog();
  if (!shopConnected()) return locals;
  const all: Remote[] = [];
  let cursor: string | null = null;
  do {
    const page: {
      products: {
        nodes: Remote[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    } = await query(`query Products($cursor:String){products(first:100,after:$cursor){nodes{handle title description productType tags images(first:20){nodes{url altText}} variants(first:100){nodes{id title availableForSale price{amount currencyCode}}}} pageInfo{hasNextPage endCursor}}}`, {
      cursor
    });
    all.push(...page.products.nodes);
    cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
  } while (cursor);
  return all.map(p => {
    const key = p.tags.find(t => t.startsWith('catalog:'))?.slice(8) || p.handle;
    const local = locals.find(l => l.id === key);
    const remoteMedia = p.images.nodes.map(im => ({
      type: 'image',
      src: im.url,
      label: im.altText || p.title,
      origin: 'original'
    }));
    return {
      id: p.handle,
      name: p.title,
      kind: p.productType || local?.kind || 'DOG TREATS',
      group: local?.group || 'other',
      image: p.images.nodes[0]?.url || local?.image || '',
      description: p.description || local?.description || '',
      details: local?.details,
      media: [...remoteMedia, ...(local?.media || [])],
      variants: p.variants.nodes,
      connected: true
    };
  });
}
export async function checkout(lines: {
  merchandiseId: string;
  quantity: number;
}[]) {
  const data = await query<{
    cartCreate: {
      cart: {
        checkoutUrl: string;
      } | null;
      userErrors: {
        message: string;
      }[];
    };
  }>(`mutation Cart($input:CartInput!){cartCreate(input:$input){cart{checkoutUrl} userErrors{message}}}`, {
    input: {
      lines
    }
  });
  if (data.cartCreate.userErrors.length || !data.cartCreate.cart) throw new Error(data.cartCreate.userErrors[0]?.message || 'Could not create checkout.');
  return data.cartCreate.cart.checkoutUrl;
}
