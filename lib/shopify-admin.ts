import 'server-only';
import { createHash } from 'node:crypto';
import { one, rows, run, transaction } from './community-db';
import { CommunityError, id, type Member } from './community';
import { seedCMSDocuments } from './cms';
import { getCatalog, probeShopifyStorefront, shopConnected } from './shopify';
import { localCatalog, type CatalogProduct, type Media } from './catalog';
import type { CMSContent } from './cms-types';
import productMap from '@/data/shopify-product-map.json';
import { SHARED_SHOPIFY_STORE, type ShopifyAdminStatus, type ShopifyDraftInput, type ShopifyDraftResult, type ShopifyImportResult } from './shopify-admin-types';

const API_VERSION = '2026-10';
export class ShopifyAdminError extends CommunityError {
  constructor(status: number, message: string, public code = 'SHOPIFY_UNAVAILABLE') { super(status, message); }
}
function domain() { return (process.env.SHOPIFY_STORE_DOMAIN || '').trim().toLowerCase().replace(/^https:\/\//, '').replace(/\/$/, ''); }
function configuredDomain() {
  const value = domain();
  if (value !== SHARED_SHOPIFY_STORE) throw new ShopifyAdminError(409, `Connect the shared Shopify store ${SHARED_SHOPIFY_STORE} before continuing.`, 'SHOPIFY_STORE_REQUIRED');
  return value;
}
function adminToken() { return (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '').trim(); }
function adminUrl(path = 'products') { return `https://admin.shopify.com/store/${SHARED_SHOPIFY_STORE.replace('.myshopify.com', '')}/${path}`; }
async function adminQuery<T>(query: string, variables: object = {}): Promise<T> {
  const store = configuredDomain();
  if (!adminToken()) throw new ShopifyAdminError(409, 'Connect Shopify Admin access before creating or importing products.', 'SHOPIFY_ADMIN_REQUIRED');
  try {
    const response = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Shopify-Access-Token': adminToken() },
      body: JSON.stringify({ query, variables }), cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (response.status === 401 || response.status === 403) throw new ShopifyAdminError(409, 'Shopify Admin access was not accepted. Check the installed app token and product permissions.', 'SHOPIFY_ADMIN_REJECTED');
    if (!response.ok) throw new ShopifyAdminError(503, 'Shopify is temporarily unavailable. Please try again later.');
    const result = await response.json() as { data?: T; errors?: { extensions?: { code?: string } }[] };
    if (result.errors?.length || !result.data) throw new ShopifyAdminError(503, 'Shopify could not complete the request. Check the connection and required product permissions.');
    return result.data;
  } catch (error) {
    if (error instanceof ShopifyAdminError) throw error;
    throw new ShopifyAdminError(503, 'The Shopify response could not be confirmed. Please check Shopify before retrying.', 'SHOPIFY_RESPONSE_UNKNOWN');
  }
}
async function inspectAdmin() {
  const data = await adminQuery<{ shop: { name: string; myshopifyDomain: string }; currentAppInstallation: { accessScopes: { handle: string }[] } }>(
    'query BrandStudioAccess { shop { name myshopifyDomain } currentAppInstallation { accessScopes { handle } } }');
  if (data.shop.myshopifyDomain.toLowerCase() !== SHARED_SHOPIFY_STORE) throw new ShopifyAdminError(409, 'The app is connected to a different Shopify store.', 'SHOPIFY_STORE_MISMATCH');
  const scopes = new Set(data.currentAppInstallation.accessScopes.map(scope => scope.handle));
  return { shopName: data.shop.name, writeProducts: scopes.has('write_products'), readProducts: scopes.has('read_products') || scopes.has('write_products') };
}
export async function getShopifyAdminStatus(): Promise<ShopifyAdminStatus> {
  const current = domain();
  const status: ShopifyAdminStatus = {
    expectedDomain: SHARED_SHOPIFY_STORE, domain: current || null, domainMatches: current === SHARED_SHOPIFY_STORE,
    adminUrl: adminUrl(), checkedAt: Date.now(),
    storefront: { configured: shopConnected(), verified: false, hasProducts: false, message: 'Connect Storefront access to load live products, prices and availability.' },
    admin: { configured: !!adminToken(), verified: false, readProducts: false, writeProducts: false, message: 'Connect Admin access to import the full catalog and create Shopify drafts.' },
    checkout: { verified: false, message: 'Checkout is not verified. Complete the store setup and a separate checkout check before announcing that purchases are available.' },
  };
  if (!status.domainMatches) {
    status.storefront.message = status.admin.message = `Both brands must use ${SHARED_SHOPIFY_STORE}. Set the shared store connection first.`;
    return status;
  }
  await Promise.allSettled([
    (async () => {
      if (!status.storefront.configured) return;
      try {
        const result = await probeShopifyStorefront();
        status.storefront.verified = true; status.storefront.hasProducts = result.hasProducts;
        status.storefront.message = result.hasProducts ? 'Live Shopify products can be read by this website.' : 'Access works, but no products are available to this Storefront channel. Publish products to its Headless storefront.';
        status.checkout.message = 'The Shopify cart integration is configured. A real checkout check is still needed; this connection check does not create a cart or verify payment, shipping or store-password settings.';
      } catch { status.storefront.message = 'Storefront access could not be verified. Check the token, Headless permissions and product publication.'; }
    })(),
    (async () => {
      if (!status.admin.configured) return;
      try {
        const access = await inspectAdmin();
        status.admin = { configured: true, verified: true, ...access, message: access.writeProducts ? 'Product import and Shopify draft creation are available.' : access.readProducts ? 'Product import is available. Draft creation also needs write_products permission.' : 'The app is installed but needs product access.' };
      } catch (error) { status.admin.message = error instanceof ShopifyAdminError ? error.message : 'Shopify Admin access could not be verified.'; }
    })(),
  ]);
  return status;
}
type ShopifyProductMedia = { mediaContentType: string; alt: string | null; image?: { url: string; altText: string | null } | null; preview?: { image: { url: string } | null } | null; sources?: { url: string; mimeType: string }[] };
type ShopifyProduct = { id: string; handle: string; title: string; description: string; productType: string; tags: string[]; status: string; media: { nodes: ShopifyProductMedia[] } };
const productFields = 'id handle title description productType tags status media(first: 30) { nodes { mediaContentType alt preview { image { url } } ... on MediaImage { image { url altText } } ... on Video { sources { url mimeType } } } }';
function productSlug(product: ShopifyProduct) {
  const locals = localCatalog();
  const storeMap = (productMap as Record<string, Record<string, string>>)[SHARED_SHOPIFY_STORE] || {};
  const mapped = storeMap[product.id];
  if (mapped) return mapped;
  const matches = locals.filter(local => product.tags.includes(`catalog:${local.id}`));
  if (matches.length > 1) throw new ShopifyAdminError(409, 'A Shopify product matches more than one website product. Review its catalog tags before importing.', 'SHOPIFY_MAPPING_CONFLICT');
  return matches[0]?.id || product.handle;
}
function editorial(product: CatalogProduct): CMSContent {
  return {
    title: product.name, excerpt: (product.details?.tagline.en || product.description).slice(0, 1000), body: product.details?.overview.en || product.description,
    media: product.media.slice(0, 30).map(media => ({ type: media.type === 'video' ? 'video' : 'image', src: media.src, alt: media.label || product.name, ...(media.poster ? { poster: media.poster } : {}), origin: media.origin === 'ai' ? 'ai' : 'original' })),
    sections: [], seoTitle: product.name, seoDescription: product.description.slice(0, 160), category: product.kind,
    ...(product.details ? { product: { ingredients: product.details.ingredients, packSize: product.details.packSize, origin: product.details.origin, highlights: product.details.highlights.map(highlight => ({ title: highlight.title.en, body: highlight.body.en })) } } : {}),
  };
}
function fromAdmin(product: ShopifyProduct): { slug: string; content: CMSContent } {
  const slug = productSlug(product), local = localCatalog().find(item => item.id === slug);
  const media: Media[] = product.media.nodes.flatMap(item => {
    if (item.mediaContentType === 'IMAGE' && item.image) return [{ type: 'image', src: item.image.url, label: item.alt || item.image.altText || product.title, origin: 'original' }];
    const source = item.sources?.find(source => source.mimeType === 'video/mp4') || item.sources?.find(source => source.mimeType === 'video/webm');
    if (item.mediaContentType === 'VIDEO' && source) return [{ type: 'video', src: source.url, label: item.alt || product.title, origin: 'original', ...(item.preview?.image ? { poster: item.preview.image.url } : {}) }];
    return [];
  });
  return { slug, content: editorial({ id: slug, name: product.title, kind: product.productType || local?.kind || 'Dog treats', group: local?.group || 'other', image: media.find(item => item.type === 'image')?.src || '', description: product.description,
    details: local?.details, media, variants: [], connected: false }) };
}
async function insertDrafts(items: { slug: string; content: CMSContent }[], actor: Member, action: string) {
  await seedCMSDocuments();
  const mutation = id(), now = Date.now();
  if (new Set(items.map(item => item.slug)).size !== items.length) throw new ShopifyAdminError(409, 'Some Shopify products resolve to the same website address. Review their catalog tags before importing.', 'SHOPIFY_MAPPING_CONFLICT');
  for (let index = 0; index < items.length; index += 100) {
    const batch = items.slice(index, index + 100);
    await transaction(batch.flatMap(item => {
      const documentId = id(), json = JSON.stringify(item.content);
      return [
        { sql: 'INSERT INTO cms_documents(id,kind,slug,draft,published,revision,updated_at,published_at,mutation) VALUES (?,\'product\',?,?,NULL,1,?,NULL,?) ON CONFLICT(kind,slug) DO NOTHING', values: [documentId, item.slug, json, now, mutation] },
        { sql: 'INSERT INTO cms_audit(id,document_id,user_id,actor_name,action,revision,created_at,snapshot) SELECT ?,id,?,?,?,revision,?,draft FROM cms_documents WHERE id=? AND mutation=?', values: [id(), actor.id, actor.name, action, now, documentId, mutation] },
      ];
    }));
  }
  return rows<{ id: string; slug: string }>('SELECT id,slug FROM cms_documents WHERE mutation=?', [mutation]);
}
export async function importShopifyProducts(actor: Member): Promise<ShopifyImportResult> {
  configuredDomain();
  let items: { slug: string; content: CMSContent }[] = [];
  let source: 'admin' | 'storefront';
  if (adminToken()) {
    const access = await inspectAdmin();
    if (!access.readProducts) throw new ShopifyAdminError(409, 'The installed app needs read_products or write_products permission to import products.', 'SHOPIFY_SCOPE_REQUIRED');
    source = 'admin'; let cursor: string | null = null; const seen = new Set<string>();
    do {
      const data: { products: { nodes: ShopifyProduct[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } = await adminQuery(`query StudioProducts($cursor: String) { products(first: 50, after: $cursor) { nodes { ${productFields} } pageInfo { hasNextPage endCursor } } }`, { cursor });
      items.push(...data.products.nodes.map(fromAdmin));
      cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
      if (data.products.pageInfo.hasNextPage && (!cursor || seen.has(cursor))) throw new ShopifyAdminError(503, 'The Shopify catalog could not be fully read. No import was applied.');
      if (cursor) seen.add(cursor);
    } while (cursor);
  } else {
    if (!shopConnected()) throw new ShopifyAdminError(409, 'Connect Shopify Storefront or Admin access before importing products.', 'SHOPIFY_CONNECTION_REQUIRED');
    source = 'storefront';
    items = (await getCatalog()).filter(product => product.connected).map(product => ({ slug: product.id, content: editorial(product) }));
  }
  const inserted = await insertDrafts(items, actor, 'import_from_shopify');
  return { source, imported: inserted.length, existing: items.length - inserted.length, total: items.length,
    message: `${inserted.length} new website ${inserted.length === 1 ? 'draft' : 'drafts'} imported. ${items.length - inserted.length} existing entries kept unchanged. Shopify prices, stock and channel publication were not changed.` };
}
function draftInput(value: unknown): ShopifyDraftInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ShopifyAdminError(400, 'Check the product fields.', 'INVALID_PRODUCT');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['requestId', 'title', 'description', 'productType', 'vendor'].includes(key))) throw new ShopifyAdminError(400, 'Unsupported product field.', 'INVALID_PRODUCT');
  const field = (key: string, limit: number, required = false) => {
    const result = input[key];
    if (typeof result !== 'string' || result.length > limit || /\u0000/.test(result) || (required && !result.trim())) throw new ShopifyAdminError(400, 'Check the product fields and their length.', 'INVALID_PRODUCT');
    return result.trim();
  };
  const requestId = field('requestId', 36, true);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) throw new ShopifyAdminError(400, 'Start a new product form and try again.', 'INVALID_PRODUCT');
  return { requestId, title: field('title', 180, true), description: field('description', 15000), productType: field('productType', 80), vendor: field('vendor', 80) };
}
const html = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export async function createShopifyDraft(value: unknown, actor: Member): Promise<ShopifyDraftResult> {
  const input = draftInput(value), payloadHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const access = await inspectAdmin();
  if (!access.writeProducts) throw new ShopifyAdminError(409, 'Creating products requires write_products permission on the installed Shopify app.', 'SHOPIFY_SCOPE_REQUIRED');
  const claimed = await one<{ request_key: string }>('INSERT INTO shopify_draft_requests(request_key,payload_hash,actor_id,state,response,created_at) VALUES (?,?,?,\'pending\',NULL,?) ON CONFLICT(request_key) DO NOTHING RETURNING request_key', [input.requestId, payloadHash, actor.id, Date.now()]);
  if (!claimed) {
    const previous = await one<{ payload_hash: string; actor_id: string; state: string; response: string | null }>('SELECT payload_hash,actor_id,state,response FROM shopify_draft_requests WHERE request_key=?', [input.requestId]);
    if (!previous || previous.payload_hash !== payloadHash || previous.actor_id !== actor.id) throw new ShopifyAdminError(409, 'Start a new product form for these changes.', 'REQUEST_CONFLICT');
    if (previous.state === 'succeeded' && previous.response) return JSON.parse(previous.response) as ShopifyDraftResult;
    if (previous.state === 'failed' && previous.response) throw new ShopifyAdminError(422, previous.response, 'PRODUCT_REJECTED');
    throw new ShopifyAdminError(409, 'This creation request is pending or its outcome is uncertain. Check Shopify Products before creating it again.', 'CREATE_OUTCOME_UNKNOWN');
  }
  let product: ShopifyProduct | null = null;
  try {
    const data = await adminQuery<{ productCreate: { product: ShopifyProduct | null; userErrors: { field: string[] | null; message: string }[] } }>(
      `mutation StudioDraft($product: ProductCreateInput!) { productCreate(product: $product) { product { ${productFields} } userErrors { field message } } }`,
      { product: { title: input.title, handle: `${input.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'new-product'}-${input.requestId.slice(0, 8)}`, descriptionHtml: input.description.split(/\n\s*\n/).filter(Boolean).map(text => `<p>${html(text).replace(/\n/g, '<br>')}</p>`).join(''), productType: input.productType, vendor: input.vendor, status: 'DRAFT', tags: [`studio-request:${input.requestId}`] } });
    if (data.productCreate.userErrors.length) {
      const message = data.productCreate.userErrors.map(error => error.message).join(' ').slice(0, 1500);
      await run('UPDATE shopify_draft_requests SET state=\'failed\',response=? WHERE request_key=?', [message, input.requestId]);
      throw new ShopifyAdminError(422, message, 'PRODUCT_REJECTED');
    }
    product = data.productCreate.product;
    if (!product || product.status !== 'DRAFT' || !/^gid:\/\/shopify\/Product\/\d+$/.test(product.id)) throw new ShopifyAdminError(503, 'The Shopify creation result could not be confirmed.', 'CREATE_OUTCOME_UNKNOWN');
  } catch (error) {
    if (error instanceof ShopifyAdminError && error.code === 'PRODUCT_REJECTED') throw error;
    await run('UPDATE shopify_draft_requests SET state=\'uncertain\' WHERE request_key=?', [input.requestId]).catch(() => {});
    throw new ShopifyAdminError(503, 'The creation result is uncertain. Check Shopify Products for this item before submitting a new request.', 'CREATE_OUTCOME_UNKNOWN');
  }
  const output: ShopifyDraftResult = { product: { id: product.id, title: product.title, handle: product.handle, status: 'DRAFT', adminUrl: adminUrl(`products/${product.id.split('/').at(-1)}`) },
    message: 'Draft created in Shopify. Set its price, variants, images and inventory in Shopify, then activate it and publish it to the Headless storefront when it is ready.' };
  try { output.documentId = (await insertDrafts([fromAdmin(product)], actor, 'create_shopify_draft'))[0]?.id; }
  catch { output.warning = 'The Shopify draft was created, but its website entry could not be imported. Use Import products after the connection recovers.'; }
  await run('UPDATE shopify_draft_requests SET state=\'succeeded\',response=? WHERE request_key=?', [JSON.stringify(output), input.requestId]).catch(() => {
    output.warning = 'The Shopify draft was created. Save its Shopify link; this request cannot be safely retried until its result is confirmed.';
  });
  return output;
}
