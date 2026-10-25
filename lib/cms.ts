import 'server-only';
import { cloudDatabase, rows, one, transaction, type Statement } from './community-db';
import { CommunityError, id, type Member } from './community';
import { cmsSeeds } from './cms-seeds';
import type { CMSKind, CMSContent, CMSDocument, CMSPublished, CMSMedia, CMSSection, CMSAudit, CMSInboxMessage } from './cms-types';

const kinds: CMSKind[] = ['product', 'article', 'event', 'page'];
export function cmsKind(value: unknown): CMSKind {
  if (!kinds.includes(value as CMSKind)) throw new CommunityError(400, 'Choose a valid content type.');
  return value as CMSKind;
}
export function cmsSlug(value: unknown) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 100) throw new CommunityError(400, 'Use a short URL with lowercase letters, numbers and hyphens.');
  return value;
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CommunityError(400, 'Please check the content fields.');
  return value as Record<string, unknown>;
};
function text(value: unknown, max: number, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) throw new CommunityError(400, `Please check the content fields (maximum ${max} characters).`);
  return value.trim();
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new CommunityError(400, 'Too many content items.');
  return value;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new CommunityError(400, 'Unsupported content field.');
}
export function mediaURL(value: unknown, empty = false): string {
  const src = text(value, 2000, !empty);
  if (!src && empty) return '';
  if (/^\/api\/media\/[a-f0-9]{40}$/.test(src)) return src;
  try { if (src.startsWith('/assets/') && !/[?#\\]/.test(src) && !/(^|\/)\.\.?($|\/)/.test(decodeURIComponent(src))) return src; } catch { /* malformed asset path */ }
  try {
    const url = new URL(src);
    if (url.protocol === 'https:' && !url.username && !url.password && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return url.href;
  } catch { /* invalid URL */ }
  throw new CommunityError(400, 'Use a media library item, an asset path or an HTTPS media URL.');
}
function media(value: unknown): CMSMedia {
  const m = object(value); keys(m, ['type', 'src', 'alt', 'poster', 'origin']);
  if (m.type !== 'image' && m.type !== 'video') throw new CommunityError(400, 'Choose an image or video.');
  if (m.origin !== undefined && m.origin !== 'original' && m.origin !== 'ai') throw new CommunityError(400, 'Choose a valid media origin.');
  return { type: m.type, src: mediaURL(m.src), alt: text(m.alt ?? '', 300), ...(m.poster ? { poster: mediaURL(m.poster) } : {}), ...(m.origin ? { origin: m.origin as 'original' | 'ai' } : {}) };
}
export function validateContent(kind: CMSKind, value: unknown): CMSContent {
  const c = object(value);
  keys(c, ['title', 'subtitle', 'excerpt', 'body', 'media', 'sections', 'seoTitle', 'seoDescription', 'category', 'featured', 'product', 'event', 'page']);
  const content: CMSContent = {
    title: text(c.title, 180, true), excerpt: text(c.excerpt ?? '', 1000), body: text(c.body ?? '', 100000),
    media: list(c.media ?? [], 30).map(media),
    sections: list(c.sections ?? [], 100).map(value => {
      const s = object(value); keys(s, ['heading', 'body', 'media']);
      return { heading: text(s.heading ?? '', 180), body: text(s.body ?? '', 15000), ...(s.media ? { media: media(s.media) } : {}) } as CMSSection;
    }),
    seoTitle: text(c.seoTitle ?? '', 180), seoDescription: text(c.seoDescription ?? '', 500)
  };
  if (c.subtitle !== undefined) content.subtitle = text(c.subtitle, 300);
  if (c.category !== undefined) content.category = text(c.category, 80);
  if (c.featured !== undefined) {
    if (typeof c.featured !== 'boolean') throw new CommunityError(400, 'Please check the featured setting.');
    content.featured = c.featured;
  }
  if (c.product !== undefined) {
    if (kind !== 'product') throw new CommunityError(400, 'Product fields only belong to products.');
    const p = object(c.product); keys(p, ['ingredients', 'packSize', 'origin', 'highlights']);
    content.product = {
      ingredients: text(p.ingredients ?? '', 3000), packSize: text(p.packSize ?? '', 300), origin: text(p.origin ?? '', 300),
      highlights: list(p.highlights ?? [], 20).map(value => { const h = object(value); keys(h, ['title', 'body']); return { title: text(h.title, 120), body: text(h.body, 1000) }; })
    };
  }
  if (c.event !== undefined) {
    if (kind !== 'event') throw new CommunityError(400, 'Event fields only belong to events.');
    const e = object(c.event); keys(e, ['date', 'endDate', 'location', 'registrationUrl', 'status']);
    const date = text(e.date ?? '', 60), endDate = text(e.endDate ?? '', 60);
    if ([date, endDate].some(d => d && (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(d) || !Number.isFinite(Date.parse(d))))) throw new CommunityError(400, 'Use a valid event date.');
    if (date && endDate && Date.parse(endDate) < Date.parse(date)) throw new CommunityError(400, 'The end date must follow the start date.');
    if (!['planned', 'scheduled', 'cancelled'].includes(String(e.status))) throw new CommunityError(400, 'Choose an event status.');
    if (e.status === 'scheduled' && !date) throw new CommunityError(400, 'Add a date before announcing a scheduled event.');
    const registrationUrl = text(e.registrationUrl ?? '', 2000);
    if (registrationUrl) {
      try { const url = new URL(registrationUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid URL'); }
      catch { throw new CommunityError(400, 'Use an HTTPS registration link.'); }
    }
    content.event = { date, endDate, location: text(e.location ?? '', 500), registrationUrl, status: e.status as 'planned' | 'scheduled' | 'cancelled' };
  }
  if (c.page !== undefined) {
    if (kind !== 'page') throw new CommunityError(400, 'Page sections only belong to pages.');
    const p = object(c.page); keys(p, ['sections']);
    const seen = new Set<string>();
    content.page = { sections: list(p.sections ?? [], 30).map(value => {
      const s = object(value); keys(s, ['key', 'title', 'subtitle', 'body', 'media']);
      const key = text(s.key, 80, true);
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key) || seen.has(key)) throw new CommunityError(400, 'Page section keys must be unique.');
      seen.add(key);
      return { key, title: text(s.title ?? '', 180), subtitle: text(s.subtitle ?? '', 300), body: text(s.body ?? '', 10000), media: list(s.media ?? [], 20).map(media) };
    }) };
  }
  if (JSON.stringify(content).length > 250000) throw new CommunityError(413, 'This document is too large.');
  return content;
}

type DocumentRow = { id: string; kind: CMSKind; slug: string; draft: string; published: string | null; revision: number; updated_at: number; published_at: number | null; mutation: string };
function document(row: DocumentRow): CMSDocument {
  return { id: row.id, kind: row.kind, slug: row.slug, draft: JSON.parse(row.draft), published: row.published ? JSON.parse(row.published) : null, revision: Number(row.revision), updatedAt: Number(row.updated_at), publishedAt: row.published_at === null ? null : Number(row.published_at) };
}
let seeded: Promise<void> | undefined;
async function ensureSeeds() {
  if (!seeded) seeded = (async () => {
    const now = Date.now();
    await transaction(cmsSeeds.map(seed => ({ sql: 'INSERT INTO cms_documents(id,kind,slug,draft,published,revision,updated_at,published_at,mutation) VALUES (?,?,?,?,?,1,?,?,?) ON CONFLICT(kind,slug) DO NOTHING', values: [id(), seed.kind, seed.slug, JSON.stringify(seed.content), JSON.stringify(seed.content), now, now, 'seed'] })));
  })().catch(error => { seeded = undefined; throw error; });
  await seeded;
}
let discoveredProductsAt = 0;
async function discoverShopifyProducts() {
  if (Date.now() - discoveredProductsAt < 30000) return;
  try {
    // Dynamic import avoids a module cycle: the catalog itself reads published overrides.
    const { getCatalog } = await import('./shopify');
    const products = await getCatalog();
    const now = Date.now();
    await transaction(products.map(product => {
      const content: CMSContent = {
        title: product.name, excerpt: (product.details?.tagline.en || product.description).slice(0, 600),
        body: product.details?.overview.en || product.description, sections: [],
        media: product.media.slice(0, 30).map(item => ({ type: item.type === 'video' ? 'video' : 'image', src: item.src, alt: item.label || product.name, ...(item.poster ? { poster: item.poster } : {}), origin: item.origin === 'ai' ? 'ai' : 'original' })),
        seoTitle: product.name, seoDescription: product.description.slice(0, 160),
        ...(product.details ? { product: { ingredients: product.details.ingredients, packSize: product.details.packSize, origin: product.details.origin, highlights: product.details.highlights.map(h => ({ title: h.title.en, body: h.body.en })) } } : {})
      };
      const json = JSON.stringify(content);
      return { sql: 'INSERT INTO cms_documents(id,kind,slug,draft,published,revision,updated_at,published_at,mutation) VALUES (?,?,?,?,?,1,?,?,?) ON CONFLICT(kind,slug) DO NOTHING', values: [id(), 'product', product.id, json, json, now, now, 'shopify-discovery'] };
    }));
    discoveredProductsAt = now;
  } catch { console.error('Shopify product discovery is temporarily unavailable; existing CMS content remains editable.'); }
}
export async function listCMSDocuments(kind?: CMSKind) {
  await ensureSeeds();
  if (!kind || kind === 'product') await discoverShopifyProducts();
  return (await rows<DocumentRow>(`SELECT * FROM cms_documents${kind ? ' WHERE kind=?' : ''} ORDER BY kind,updated_at DESC`, kind ? [kind] : [])).map(document);
}
export async function getCMSDocument(documentId: string) {
  const row = await one<DocumentRow>('SELECT * FROM cms_documents WHERE id=?', [documentId]);
  if (!row) throw new CommunityError(404, 'Content not found.');
  return document(row);
}
export async function createCMSDocument(kind: CMSKind, slug: string, value: unknown, actor: Member) {
  await ensureSeeds();
  const content = validateContent(kind, value), documentId = id(), now = Date.now(), mutation = id();
  await transaction([
    { sql: 'INSERT INTO cms_documents(id,kind,slug,draft,published,revision,updated_at,published_at,mutation) VALUES (?,?,?,?,NULL,1,?,NULL,?) ON CONFLICT(kind,slug) DO NOTHING', values: [documentId, kind, slug, JSON.stringify(content), now, mutation] },
    { sql: "INSERT INTO cms_audit(id,document_id,user_id,actor_name,action,revision,created_at,snapshot) SELECT ?,id,?,?,?,revision,?,draft FROM cms_documents WHERE id=?", values: [id(), actor.id, actor.name, 'create', now, documentId] }
  ]);
  if (!await one('SELECT id FROM cms_documents WHERE id=?', [documentId])) throw new CommunityError(409, 'That URL already exists. Open its document or choose a different URL.');
  return getCMSDocument(documentId);
}
export async function mutateCMSDocument(documentId: string, revision: unknown, action: 'save' | 'publish' | 'unpublish', actor: Member, value?: unknown) {
  if (!Number.isInteger(revision) || Number(revision) < 1) throw new CommunityError(400, 'A valid document revision is required.');
  const existing = await getCMSDocument(documentId);
  if (existing.revision !== revision) throw new CommunityError(409, 'This document changed in another session. Reload it before saving.');
  const content = action === 'save' ? validateContent(existing.kind, value) : validateContent(existing.kind, existing.draft);
  const serialized = JSON.stringify(content), now = Date.now(), mutation = id();
  const assetIds = action === 'publish' ? managedAssetIds(content) : [];
  for (const assetId of assetIds) if (!await one('SELECT id FROM cms_assets WHERE id=? AND ready=1', [assetId])) throw new CommunityError(400, 'A media upload is missing or unfinished. Complete it before publishing.');
  const set = action === 'save' ? 'draft=?' : action === 'publish' ? 'published=draft,published_at=?' : 'published=NULL';
  const actionValues = action === 'save' ? [serialized] : action === 'publish' ? [now] : [];
  const statements: Statement[] = [
    { sql: `UPDATE cms_documents SET ${set},revision=revision+1,updated_at=?,mutation=? WHERE id=? AND revision=?`, values: [...actionValues, now, mutation, documentId, Number(revision)] },
    { sql: 'INSERT INTO cms_audit(id,document_id,user_id,actor_name,action,revision,created_at,snapshot) SELECT ?,id,?,?,?,revision,?,draft FROM cms_documents WHERE id=? AND mutation=?', values: [id(), actor.id, actor.name, action, now, documentId, mutation] }
  ];
  if (action !== 'save') {
    statements.push({ sql: 'DELETE FROM cms_asset_refs WHERE document_id=? AND EXISTS (SELECT 1 FROM cms_documents WHERE id=? AND mutation=?)', values: [documentId, documentId, mutation] });
    for (const assetId of assetIds) statements.push({ sql: 'INSERT INTO cms_asset_refs(document_id,asset_id) SELECT id,? FROM cms_documents WHERE id=? AND mutation=?', values: [assetId, documentId, mutation] });
  }
  await transaction(statements);
  const current = await one<DocumentRow>('SELECT * FROM cms_documents WHERE id=?', [documentId]);
  if (!current || current.mutation !== mutation) throw new CommunityError(409, 'This document changed in another session. Reload it before saving.');
  return document(current);
}
export function managedAssetIds(content: CMSContent) {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === 'string' && /^\/api\/media\/[a-f0-9]{40}$/.test(value)) ids.add(value.split('/').at(-1)!);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(content.media); visit(content.sections); visit(content.page);
  return [...ids];
}
export async function getPublicCMSState(kind?: CMSKind): Promise<{ documents: CMSPublished[]; hiddenSlugs: string[] }> {
  const defaults = cmsSeeds.filter(seed => !kind || seed.kind === kind).map(seed => ({ id: `seed-${seed.kind}-${seed.slug}`, kind: seed.kind, slug: seed.slug, content: seed.content, updatedAt: 0, publishedAt: 0 }));
  let stored: Pick<DocumentRow, 'id' | 'kind' | 'slug' | 'published' | 'updated_at' | 'published_at'>[];
  try {
    // Draft content is deliberately never selected for a public request.
    stored = await rows(`SELECT id,kind,slug,published,updated_at,published_at FROM cms_documents${kind ? ' WHERE kind=?' : ''}`, kind ? [kind] : []);
  } catch (error) {
    // A configured store must fail closed: fallback could resurrect unpublished content.
    if (cloudDatabase() || process.env.VERCEL) throw error;
    return { documents: defaults, hiddenSlugs: [] };
  }
  const combined = new Map(defaults.map(record => [`${record.kind}:${record.slug}`, record]));
  const hiddenSlugs: string[] = [];
  for (const record of stored) {
    const key = `${record.kind}:${record.slug}`;
    if (record.published === null) {
      const hadPublicVersion = combined.has(key) || record.published_at !== null;
      combined.delete(key);
      // Never expose the slug of a newly created, never-published draft.
      if (hadPublicVersion) hiddenSlugs.push(record.slug);
    }
    else combined.set(key, { id: record.id, kind: record.kind, slug: record.slug, content: JSON.parse(record.published), updatedAt: Number(record.updated_at), publishedAt: Number(record.published_at) });
  }
  return { documents: [...combined.values()], hiddenSlugs };
}
export async function getPublishedDocuments(kind?: CMSKind) { return (await getPublicCMSState(kind)).documents; }
export async function getPublishedDocument(kind: CMSKind, slug: string) { return (await getPublishedDocuments(kind)).find(record => record.slug === slug) || null; }
export async function cmsAudit(): Promise<CMSAudit[]> {
  const records = await rows<{ id: string; document_id: string; actor_name: string; action: string; revision: number; created_at: number }>('SELECT id,document_id,actor_name,action,revision,created_at FROM cms_audit ORDER BY created_at DESC LIMIT 100');
  return records.map(r => ({ id: r.id, documentId: r.document_id, actorName: r.actor_name, action: r.action, revision: Number(r.revision), createdAt: Number(r.created_at) }));
}
export async function cmsInbox(): Promise<CMSInboxMessage[]> {
  const records = await rows<{ id: string; name: string; email: string; subject: string; message: string; status: CMSInboxMessage['status']; created_at: number }>('SELECT id,name,email,subject,message,status,created_at FROM cms_inbox ORDER BY created_at DESC LIMIT 500');
  return records.map(({ created_at, ...r }) => ({ ...r, createdAt: Number(created_at) }));
}
export async function updateInbox(messageId: string, status: unknown) {
  if (!['read', 'unread', 'archived'].includes(String(status))) throw new CommunityError(400, 'Choose a valid message status.');
  const record = await one('UPDATE cms_inbox SET status=? WHERE id=? RETURNING id', [String(status), messageId]);
  if (!record) throw new CommunityError(404, 'Message not found.');
}

export async function cmsJSON(request: Request) {
  const { limitedBody } = await import('./community');
  try { return object(JSON.parse((await limitedBody(request, 300000)).toString('utf8'))); }
  catch (error) { if (error instanceof CommunityError) throw error; throw new CommunityError(400, 'Please check the form.'); }
}
export async function adminRequest(request: Request, mutation = false) {
  const { requireAdmin, sameOrigin, rateLimit } = await import('./community');
  if (mutation) sameOrigin(request);
  const actor = await requireAdmin();
  await rateLimit(`cms:${mutation ? 'write' : 'read'}:${actor.id}`, mutation ? 150 : 600);
  return actor;
}
