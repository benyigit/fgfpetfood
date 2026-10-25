import 'server-only';
import { createHash, createHmac } from 'node:crypto';
import sharp from 'sharp';
import { communityBrand, rows, one, run, transaction } from './community-db';
import { CommunityError, field, id, rateLimit, type Member } from './community';
import { getCMSDocument } from './cms';
import { cmsAssetIsPublished, getCMSAsset, serveCMSAsset } from './cms-storage';
import type { AIConnectionState, SocialDraft, SocialDraftInput, SocialDraftStatus, SocialHistory, SocialPlatform } from './ai-studio-types';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function requestKey(value: unknown, scope: string, actor: Member) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(value)) throw new CommunityError(400, 'A valid request reference is required.');
  return hash([communityBrand, actor.id, scope, value]);
}
function platform(value: unknown): SocialPlatform {
  if (value !== 'facebook' && value !== 'instagram') throw new CommunityError(400, 'Choose Facebook or Instagram.');
  return value;
}
function graphVersion() { const value = process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0'; return /^v\d+\.\d+$/.test(value) ? value : ''; }
function publicOrigin() {
  try { const url = new URL(process.env.SOCIAL_PUBLIC_ORIGIN || ''); if (url.protocol === 'https:' && !url.username && !url.password && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.pathname === '/' && !url.search && !url.hash) return url.origin; } catch { /* disconnected */ }
  return '';
}
export function socialConnectionStatus(target: SocialPlatform): AIConnectionState {
  const needed = ['META_PAGE_ACCESS_TOKEN', 'META_PAGE_ID', 'SOCIAL_PUBLIC_ORIGIN', ...(target === 'instagram' ? ['META_INSTAGRAM_ACCOUNT_ID'] : [])];
  const missing = needed.filter(name => !process.env[name]?.trim());
  if (!publicOrigin() && !missing.includes('SOCIAL_PUBLIC_ORIGIN')) missing.push('SOCIAL_PUBLIC_ORIGIN (HTTPS origin required)');
  if (!graphVersion()) missing.push('META_GRAPH_API_VERSION (valid version required)');
  const accountId = target === 'instagram' ? process.env.META_INSTAGRAM_ACCOUNT_ID?.trim() || '' : process.env.META_PAGE_ID?.trim() || '';
  if (accountId && !/^\d+$/.test(accountId)) missing.push(target === 'instagram' ? 'META_INSTAGRAM_ACCOUNT_ID (numeric ID required)' : 'META_PAGE_ID (numeric ID required)');
  return { configured: !missing.length, verified: false, accountId, missing, note: missing.length ? 'Not connected. Add the server configuration for this brand.' : 'Server configuration is present. Account permissions and token validity are checked by Meta when publishing; this is not a verified connection.' };
}
type DraftRow = { id: string; platform: SocialPlatform; caption: string; media_src: string; media_alt: string; source_product_id: string; revision: number; status: SocialDraftStatus; generated: number; created_at: number; updated_at: number; published_at: number | null; published_url: string; error: string; mutation: string };
type Attempt = { id: string; draft_id: string; revision: number; account_id: string; platform: SocialPlatform; state: string; container_id: string; external_id: string; error: string; created_at: number; updated_at: number };
const dto = (d: DraftRow): SocialDraft => ({ id: d.id, platform: d.platform, caption: d.caption, mediaSrc: d.media_src, mediaAlt: d.media_alt, sourceProductId: d.source_product_id || undefined, revision: Number(d.revision), status: d.status, generated: !!d.generated, createdAt: Number(d.created_at), updatedAt: Number(d.updated_at), publishedAt: d.published_at ? Number(d.published_at) : null, publishedUrl: d.published_url, error: d.error });
async function draftRow(draftId: string) {
  if (!/^[a-f0-9]{40}$/.test(draftId)) throw new CommunityError(404, 'Social draft not found.');
  const row = await one<DraftRow>('SELECT * FROM social_drafts WHERE id=?', [draftId]);
  if (!row) throw new CommunityError(404, 'Social draft not found.');
  return row;
}
export async function listSocialDrafts() {
  const [drafts, events] = await Promise.all([
    rows<DraftRow>('SELECT * FROM social_drafts ORDER BY updated_at DESC LIMIT 200'),
    rows<{id:string;draft_id:string;action:string;actor_name:string;created_at:number;detail:string}>('SELECT id,draft_id,action,actor_name,created_at,detail FROM social_history ORDER BY created_at DESC LIMIT 150')
  ]);
  return { drafts: drafts.map(dto), history: events.map(e => ({ id: e.id, draftId: e.draft_id, action: e.action, actorName: e.actor_name, createdAt: Number(e.created_at), detail: e.detail })) satisfies SocialHistory[] };
}
async function validatedInput(body: Record<string, unknown>): Promise<SocialDraftInput> {
  const target = platform(body.platform), caption = field(body.caption, target === 'instagram' ? 2200 : 10000, false), mediaSrc = field(body.mediaSrc ?? '', 200, false), mediaAlt = field(body.mediaAlt ?? '', 300, false), sourceProductId = field(body.sourceProductId ?? '', 100, false);
  if (mediaSrc) {
    if (!/^\/api\/media\/[a-f0-9]{40}$/.test(mediaSrc)) throw new CommunityError(400, 'Choose an image from this brand’s media library. Community and external photos are not supported.');
    const asset = await getCMSAsset(mediaSrc.split('/').pop()!);
    if (!asset.ready || asset.type !== 'image') throw new CommunityError(400, 'Choose a completed image upload. Social video publishing is not enabled.');
  }
  if (sourceProductId && (await getCMSDocument(sourceProductId)).kind !== 'product') throw new CommunityError(400, 'Choose a product source.');
  return { platform: target, caption, mediaSrc, mediaAlt, ...(sourceProductId ? { sourceProductId } : {}) };
}
function historyStatement(draftId: string, action: string, actor: Member, detail: string, snapshot: unknown, mutation?: string) {
  const values = [id(), draftId, action, actor.name, actor.id, Date.now(), detail, JSON.stringify(snapshot)];
  return mutation ? { sql: 'INSERT INTO social_history(id,draft_id,action,actor_name,actor_id,created_at,detail,snapshot) SELECT ?,?,?,?,?,?,?,? FROM social_drafts WHERE id=? AND mutation=?', values: [...values, draftId, mutation] }
    : { sql: 'INSERT INTO social_history(id,draft_id,action,actor_name,actor_id,created_at,detail,snapshot) VALUES (?,?,?,?,?,?,?,?)', values };
}
export async function createSocialDraft(body: Record<string, unknown>, actor: Member, generated = false) {
  const input = await validatedInput(body), key = requestKey(body.requestId, generated ? 'ai-social-draft' : 'social-draft', actor), fingerprint = hash(input);
  const old = await one<{payload_hash:string;result:string|null}>('SELECT payload_hash,result FROM studio_requests WHERE request_key=?', [key]);
  if (old) {
    if (old.payload_hash !== fingerprint) throw new CommunityError(409, 'This request reference belongs to another draft.');
    if (old.result) return dto(await draftRow(old.result));
    throw new CommunityError(409, 'This draft is already being saved.');
  }
  const draftId = id(), now = Date.now();
  await transaction([
    { sql: "INSERT INTO studio_requests(request_key,payload_hash,actor_id,state,result,created_at) VALUES (?,?,?,'completed',?,?) ON CONFLICT(request_key) DO NOTHING", values: [key, fingerprint, actor.id, draftId, now] },
    { sql: 'INSERT INTO social_drafts(id,platform,caption,media_src,media_alt,source_product_id,generated,created_by,created_at,updated_at,mutation) SELECT ?,?,?,?,?,?,?,?,?,?,? FROM studio_requests WHERE request_key=? AND result=?', values: [draftId, input.platform, input.caption, input.mediaSrc, input.mediaAlt, input.sourceProductId || '', generated ? 1 : 0, actor.id, now, now, draftId, key, draftId] },
    historyStatement(draftId, generated ? 'generated' : 'created', actor, generated ? 'AI social draft saved for human review.' : 'Manual social draft saved.', input, draftId)
  ]);
  const saved = await one<{result:string;payload_hash:string}>('SELECT result,payload_hash FROM studio_requests WHERE request_key=?', [key]);
  if (!saved || saved.payload_hash !== fingerprint) throw new CommunityError(409, 'Another draft used this request reference.');
  return dto(await draftRow(saved.result));
}
export async function updateSocialDraft(draftId: string, body: Record<string, unknown>, actor: Member) {
  const input = await validatedInput(body), row = await draftRow(draftId), revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 1 || row.revision != revision) throw new CommunityError(409, 'This draft changed. Reload before saving.');
  if (row.status !== 'draft' && row.status !== 'failed') throw new CommunityError(409, 'Published, publishing or unresolved posts cannot be edited. Create a new draft instead.');
  const mutation = id();
  await transaction([
    { sql: "UPDATE social_drafts SET platform=?,caption=?,media_src=?,media_alt=?,source_product_id=?,revision=revision+1,status='draft',error='',updated_at=?,mutation=? WHERE id=? AND revision=? AND status IN ('draft','failed')", values: [input.platform, input.caption, input.mediaSrc, input.mediaAlt, input.sourceProductId || '', Date.now(), mutation, draftId, revision] },
    historyStatement(draftId, 'edited', actor, 'Draft updated.', input, mutation)
  ]);
  const updated = await draftRow(draftId);
  if (updated.mutation !== mutation) throw new CommunityError(409, 'This draft changed. Reload before saving.');
  return dto(updated);
}
class MetaError extends CommunityError { constructor(message: string, public uncertain: boolean) { super(502, message); } }
async function metaRequest(target: string, method: 'GET' | 'POST', parameters: Record<string, string> = {}): Promise<Record<string, unknown>> {
  // Only server-selected numeric IDs and fixed edges can reach this adapter.
  if (!/^\d+(?:_\d+)?(?:\/(?:feed|photos|media|media_publish))?$/.test(target)) throw new CommunityError(400, 'Invalid publishing destination.');
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  if (!token || !graphVersion()) throw new CommunityError(503, 'Meta publishing is not configured.');
  const data = { ...parameters };
  if (process.env.META_APP_SECRET) data.appsecret_proof = createHmac('sha256', process.env.META_APP_SECRET).update(token).digest('hex');
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${target}`);
  if (method === 'GET') for (const [key, value] of Object.entries(data)) url.searchParams.set(key, value);
  let response: Response;
  try { response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) }, ...(method === 'POST' ? { body: JSON.stringify(data) } : {}), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000) }); }
  catch { throw new MetaError('Meta did not confirm the request. Check Meta Business Suite before trying again.', method === 'POST'); }
  let result: Record<string, unknown>;
  try { result = await response.json() as Record<string, unknown>; } catch { throw new MetaError('Meta returned an unreadable response. Check Meta Business Suite.', method === 'POST'); }
  if (!response.ok || result.error) {
    const error = result.error && typeof result.error === 'object' ? result.error as Record<string, unknown> : {};
    const code = Number(error.code), subcode = Number(error.error_subcode);
    const hint = code === 190 ? 'The Page access token expired or is invalid.' : [10, 200].includes(code) ? 'The Meta app or account is missing publishing permissions.' : code === 4 || code === 32 || response.status === 429 ? 'Meta publishing limits were reached.' : 'Meta rejected the post. Check the account permissions and image requirements.';
    throw new MetaError(`${hint} ${Number.isFinite(code) ? `(code ${code}${Number.isFinite(subcode) ? `/${subcode}` : ''})` : `(HTTP ${response.status})`}`, method === 'POST' && response.status >= 500);
  }
  return result;
}
function numericId(value: unknown) { return typeof value === 'string' && /^\d+(?:_\d+)?$/.test(value) ? value : ''; }
function safePermalink(value: unknown) {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return url.protocol === 'https:' && ['www.instagram.com','instagram.com','www.facebook.com','facebook.com'].includes(url.hostname) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
async function publishMedia(row: DraftRow) {
  if (!row.media_src) {
    if (row.platform === 'instagram') throw new CommunityError(400, 'Instagram needs a published JPEG image.');
    return { url: '', aiGenerated: false };
  }
  const assetId = row.media_src.split('/').pop()!, asset = await getCMSAsset(assetId);
  if (!asset.ready || asset.type !== 'image' || !await cmsAssetIsPublished(assetId)) throw new CommunityError(400, 'Publish this brand-owned image in website content first. Private or unpublished media cannot be sent to social platforms.');
  if (!publicOrigin()) throw new CommunityError(503, 'Set SOCIAL_PUBLIC_ORIGIN to the public HTTPS website origin.');
  if (row.platform === 'instagram') {
    if (asset.content_type !== 'image/jpeg' || Number(asset.size) > 8 * 1024 * 1024) throw new CommunityError(400, 'Instagram requires one JPEG image under 8 MB.');
    const response = await serveCMSAsset(asset, new Request(`${publicOrigin()}${row.media_src}`));
    const metadata = await sharp(Buffer.from(await response.arrayBuffer()), { limitInputPixels: 40_000_000 }).metadata();
    const ratio = (metadata.width || 0) / (metadata.height || 1);
    if (ratio < 0.8 || ratio > 1.91) throw new CommunityError(400, 'Choose an Instagram image with an aspect ratio between 4:5 and 1.91:1.');
  }
  const docs = await rows<{published:string}>('SELECT d.published FROM cms_asset_refs r JOIN cms_documents d ON d.id=r.document_id WHERE r.asset_id=? AND d.published IS NOT NULL', [assetId]);
  const hasAIOrigin = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasAIOrigin);
    const item = value as Record<string, unknown>;
    return item.src === row.media_src && item.origin === 'ai' || Object.values(item).some(hasAIOrigin);
  };
  return { url: `${publicOrigin()}${row.media_src}`, aiGenerated: docs.some(d => hasAIOrigin(JSON.parse(d.published))) };
}
async function finishAttempt(attempt: Attempt, actor: Member, state: 'published'|'failed'|'uncertain', detail: string, externalId = '', publishedUrl = '') {
  const now = Date.now();
  await transaction([
    { sql: 'UPDATE social_attempts SET state=?,external_id=?,error=?,updated_at=? WHERE id=?', values: [state, externalId, state === 'published' ? '' : detail, now, attempt.id] },
    { sql: 'UPDATE social_drafts SET status=?,error=?,published_at=?,published_url=?,updated_at=? WHERE id=? AND mutation=?', values: [state, state === 'published' ? '' : detail, state === 'published' ? now : null, publishedUrl, now, attempt.draft_id, attempt.id] },
    historyStatement(attempt.draft_id, state, actor, detail, { attemptId: attempt.id, platform: attempt.platform, accountId: attempt.account_id, externalId, publishedUrl }, attempt.id)
  ]);
  return dto(await draftRow(attempt.draft_id));
}
export async function publishSocialDraft(draftId: string, body: Record<string, unknown>, actor: Member) {
  if (body.confirm !== true || body.rightsConfirmed !== true) throw new CommunityError(400, 'Confirm this exact post and your permission to publish its content on social media.');
  const row = await draftRow(draftId), revision = Number(body.revision), key = requestKey(body.requestId, 'publish-social', actor);
  if (!Number.isInteger(revision) || revision < 1) throw new CommunityError(400, 'A draft revision is required.');
  const existing = await one<Attempt>('SELECT * FROM social_attempts WHERE request_key=?', [key]);
  if (existing) {
    if (existing.draft_id !== draftId || Number(existing.revision) !== revision) throw new CommunityError(409, 'This request reference belongs to another publishing attempt.');
    return dto(row);
  }
  if (row.revision != revision) throw new CommunityError(409, 'This post changed after preview. Review the latest version.');
  if (row.status !== 'draft' && row.status !== 'failed') throw new CommunityError(409, 'This post is published or its outcome is unresolved. Refresh its status; do not send it twice.');
  if (!row.caption.trim()) throw new CommunityError(400, 'Add a caption before publishing.');
  const connection = socialConnectionStatus(row.platform);
  if (!connection.configured) throw new CommunityError(503, `Connect ${row.platform === 'facebook' ? 'Facebook' : 'Instagram'} server credentials first. Missing: ${connection.missing.join(', ')}.`);
  if (body.accountId !== connection.accountId) throw new CommunityError(409, 'The publishing account changed. Reload connections and review the destination again.');
  const media = await publishMedia(row);
  await rateLimit(`social-publish:${actor.id}`, 10, 60 * 60 * 1000);
  await rateLimit(`social-platform:${row.platform}`, 40, 24 * 60 * 60 * 1000);
  const attemptId = id(), now = Date.now();
  await transaction([
    { sql: "UPDATE social_drafts SET status='publishing',error='',mutation=?,updated_at=? WHERE id=? AND revision=? AND status IN ('draft','failed')", values: [attemptId, now, draftId, revision] },
    { sql: "INSERT INTO social_attempts(id,request_key,draft_id,revision,account_id,platform,state,created_at,updated_at) SELECT ?,?,?,?,?,?,'started',?,? FROM social_drafts WHERE id=? AND mutation=?", values: [attemptId, key, draftId, revision, connection.accountId, row.platform, now, now, draftId, attemptId] },
    historyStatement(draftId, 'publish-confirmed', actor, 'Administrator confirmed this exact caption, destination and social-media rights.', { caption: row.caption, mediaSrc: row.media_src, mediaAlt: row.media_alt, platform: row.platform, accountId: connection.accountId, rightsConfirmed: true, revision }, attemptId)
  ]);
  const attempt = await one<Attempt>('SELECT * FROM social_attempts WHERE id=?', [attemptId]);
  if (!attempt) throw new CommunityError(409, 'Another administrator changed or started publishing this post.');
  let externalWriteStarted = false;
  try {
    if (row.platform === 'facebook') {
      externalWriteStarted = true;
      const posted = await metaRequest(`${connection.accountId}/${media.url ? 'photos' : 'feed'}`, 'POST', media.url ? { url: media.url, message: row.caption, published: 'true' } : { message: row.caption, published: 'true' });
      const externalId = numericId(posted.post_id) || numericId(posted.id);
      if (!externalId) throw new MetaError('Meta may have published this post but did not return a valid ID. Check Meta Business Suite.', true);
      return await finishAttempt(attempt, actor, 'published', 'Published to Facebook.', externalId, `https://www.facebook.com/${externalId}`);
    }
    // Creating a container is not publication; an orphan container is safe to abandon.
    const container = await metaRequest(`${connection.accountId}/media`, 'POST', { image_url: media.url, caption: row.caption, ...(row.media_alt ? { alt_text: row.media_alt } : {}), ...(media.aiGenerated ? { is_ai_generated: 'true' } : {}) });
    const containerId = numericId(container.id);
    if (!containerId) throw new MetaError('Meta did not create a usable image container. No Instagram publication was requested.', false);
    await run("UPDATE social_attempts SET container_id=?,state='container-created',updated_at=? WHERE id=?", [containerId, Date.now(), attemptId]);
    attempt.container_id = containerId;
    const readiness = await metaRequest(containerId, 'GET', { fields: 'status_code' });
    if (readiness.status_code !== 'FINISHED') throw new MetaError('Instagram has not prepared this image yet. No publication was requested. Wait a minute and retry this draft.', false);
    await run("UPDATE social_attempts SET state='dispatching',updated_at=? WHERE id=?", [Date.now(), attemptId]);
    externalWriteStarted = true;
    const posted = await metaRequest(`${connection.accountId}/media_publish`, 'POST', { creation_id: containerId });
    const externalId = numericId(posted.id);
    if (!externalId) throw new MetaError('Instagram may have published this post but did not return its media ID. Refresh status before any further action.', true);
    // Persist the external ID before the optional permalink lookup.
    await run('UPDATE social_attempts SET external_id=?,updated_at=? WHERE id=?', [externalId, Date.now(), attemptId]);
    let publishedUrl = '';
    try { publishedUrl = safePermalink((await metaRequest(externalId, 'GET', { fields: 'permalink' })).permalink); } catch { /* a missing permalink cannot turn a successful publication into a retry */ }
    return await finishAttempt(attempt, actor, 'published', 'Published to Instagram.', externalId, publishedUrl);
  } catch (error) {
    const uncertain = externalWriteStarted && (!(error instanceof MetaError) || error.uncertain);
    const detail = error instanceof MetaError ? error.message : uncertain ? 'Publishing may have completed, but confirmation could not be saved. Check Meta Business Suite and refresh status. Do not create a duplicate post.' : 'The image could not be prepared for Meta. No social post was published.';
    return await finishAttempt(attempt, actor, uncertain ? 'uncertain' : 'failed', detail);
  }
}
export async function refreshSocialDraft(draftId: string, actor: Member) {
  const row = await draftRow(draftId);
  if (row.status !== 'publishing' && row.status !== 'uncertain') return dto(row);
  await rateLimit(`social-refresh:${actor.id}`, 30, 60 * 60 * 1000);
  const attempt = await one<Attempt>('SELECT * FROM social_attempts WHERE id=? AND draft_id=?', [row.mutation, draftId]);
  if (!attempt) throw new CommunityError(409, 'This publishing attempt cannot be found. Check Meta Business Suite.');
  if (Date.now() - Number(attempt.updated_at) < 120000 && row.status === 'publishing') return dto(row);
  const connection = socialConnectionStatus(row.platform);
  if (!connection.configured || connection.accountId !== attempt.account_id) throw new CommunityError(409, 'Restore the original publishing account configuration before checking this post.');
  if (attempt.external_id) {
    const remote = await metaRequest(attempt.external_id, 'GET', { fields: row.platform === 'instagram' ? 'id,permalink' : 'id,permalink_url' });
    if (numericId(remote.id)) return finishAttempt(attempt, actor, 'published', 'Publication confirmed by Meta.', attempt.external_id, safePermalink(remote.permalink || remote.permalink_url));
  }
  if (row.platform === 'instagram' && attempt.container_id) {
    const container = await metaRequest(attempt.container_id, 'GET', { fields: 'status_code' });
    if (container.status_code === 'PUBLISHED') return finishAttempt(attempt, actor, 'published', 'Instagram confirmed the container was published. View it in Meta Business Suite.');
    if (attempt.state === 'container-created' || ['ERROR', 'EXPIRED'].includes(String(container.status_code))) return finishAttempt(attempt, actor, 'failed', 'The Instagram container was not published. Review and retry this draft.');
  }
  return finishAttempt(attempt, actor, 'uncertain', 'Meta has not confirmed whether this post was published. Check Meta Business Suite. Automatic retries are blocked to prevent duplicate posts.');
}
