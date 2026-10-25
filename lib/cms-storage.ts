import 'server-only';
import { get, head, del, issueSignedToken, presignUrl } from '@vercel/blob';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { communityBrand, localDataDir, rows, one, run } from './community-db';
import { CommunityError, id, type Member } from './community';
import { cloudPhotos } from './community-storage';
import type { CMSAsset } from './cms-types';

export const CMS_IMAGE_LIMIT = 10 * 1024 * 1024;
export const CMS_VIDEO_LIMIT = 100 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm' };
export type AssetRow = { id: string; pathname: string; type: 'image' | 'video'; name: string; content_type: string; size: number; ready: number; created_by: string; created_at: number };
const assetIdValid = (value: string) => /^[a-f0-9]{40}$/.test(value);
const localPath = (asset: AssetRow) => path.join(localDataDir(), 'cms-media', `${asset.id}.${extensions[asset.content_type]}`);
export const publicAsset = (row: AssetRow): CMSAsset => ({ id: row.id, type: row.type, name: row.name, contentType: row.content_type, size: Number(row.size), src: `/api/media/${row.id}`, createdAt: Number(row.created_at), ready: !!row.ready });
export async function getCMSAsset(assetId: string) {
  if (!assetIdValid(assetId)) throw new CommunityError(404, 'Media not found.');
  const row = await one<AssetRow>('SELECT * FROM cms_assets WHERE id=?', [assetId]);
  if (!row) throw new CommunityError(404, 'Media not found.');
  return row;
}
export async function listCMSAssets() { return (await rows<AssetRow>('SELECT * FROM cms_assets WHERE ready=1 ORDER BY created_at DESC LIMIT 300')).map(publicAsset); }
export async function prepareCMSAsset(value: unknown, actor: Member) {
  if (!value || typeof value !== 'object') throw new CommunityError(400, 'Choose a file.');
  const { name, contentType, size } = value as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof contentType !== 'string' || !extensions[contentType]) throw new CommunityError(400, 'Upload a JPG, PNG, WebP, AVIF, MP4 or WebM file.');
  const type = contentType.startsWith('video/') ? 'video' : 'image';
  const limit = type === 'video' ? CMS_VIDEO_LIMIT : CMS_IMAGE_LIMIT;
  if (!Number.isInteger(size) || Number(size) < 1 || Number(size) > limit) throw new CommunityError(413, `Choose ${type === 'video' ? 'a video under 100 MB' : 'an image under 10 MB'}.`);
  if (process.env.VERCEL && !cloudPhotos()) throw new CommunityError(503, 'Private media storage is not configured.');
  const assetId = id(), pathname = `${communityBrand}/cms/${assetId}.${extensions[contentType]}`, now = Date.now();
  await run('INSERT INTO cms_assets(id,pathname,type,name,content_type,size,ready,created_by,created_at) VALUES (?,?,?,?,?,?,0,?,?)', [assetId, pathname, type, name.trim(), contentType, Number(size), actor.id, now]);
  const asset = publicAsset(await getCMSAsset(assetId));
  if (!cloudPhotos()) return { asset, pathname, uploadMode: 'local' as const };
  // OIDC authorizes a short-lived capability for this exact object only.
  // The store credential and signing material never leave the server.
  const validUntil = Date.now() + 15 * 60 * 1000;
  const token = await issueSignedToken({ pathname, operations: ['put'], allowedContentTypes: [contentType], maximumSizeInBytes: Number(size), validUntil });
  const { presignedUrl } = await presignUrl(token, { operation: 'put', pathname, access: 'private', allowedContentTypes: [contentType], maximumSizeInBytes: Number(size), validUntil, addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 60 });
  // Upload constraints are already signed into the URL. Sending them again as
  // legacy x-* headers makes Blob reject the browser's CORS preflight.
  return { asset, pathname, uploadMode: 'presigned' as const, uploadUrl: presignedUrl, uploadHeaders: { 'Content-Type': contentType } };
}
export async function assetForUpload(assetId: string, actor: Member) {
  const asset = await getCMSAsset(assetId);
  if (asset.created_by !== actor.id || asset.ready || Date.now() - Number(asset.created_at) > 3600000) throw new CommunityError(403, 'Start a new upload from the media library.');
  return asset;
}
async function streamBytes(stream: ReadableStream<Uint8Array>, limit: number) {
  const reader = stream.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new CommunityError(413, 'The file is larger than expected.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}
async function validateFile(asset: AssetRow, bytes: Buffer) {
  if (asset.type === 'image') {
    const meta = await sharp(bytes, { limitInputPixels: 40000000, animated: false }).metadata().catch(() => null);
    const formats: Record<string, string[]> = { 'image/jpeg': ['jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'image/avif': ['heif', 'avif'] };
    if (!meta?.width || !meta.height || !formats[asset.content_type]?.includes(meta.format || '') || (meta.pages || 1) > 1) throw new CommunityError(400, 'This file is not a supported still image.');
  } else {
    const valid = asset.content_type === 'video/webm' ? bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) : bytes.subarray(4, 8).toString('ascii') === 'ftyp';
    if (!valid) throw new CommunityError(400, 'This file is not a valid MP4 or WebM video.');
  }
}
export async function saveLocalCMSAsset(asset: AssetRow, bytes: Buffer) {
  if (cloudPhotos() || process.env.VERCEL) throw new CommunityError(400, 'Use the direct upload for this site.');
  if (bytes.length !== Number(asset.size)) throw new CommunityError(400, 'The uploaded file size changed. Please choose it again.');
  await validateFile(asset, bytes);
  await mkdir(path.dirname(localPath(asset)), { recursive: true, mode: 0o700 });
  await writeFile(localPath(asset), bytes, { mode: 0o600, flag: 'wx' });
  await run('UPDATE cms_assets SET ready=1 WHERE id=?', [asset.id]);
  return publicAsset(await getCMSAsset(asset.id));
}
export async function completeCMSAsset(assetId: string, actor: Member) {
  const asset = await getCMSAsset(assetId);
  if (asset.created_by !== actor.id) throw new CommunityError(403, 'This upload belongs to another administrator.');
  if (asset.ready) return publicAsset(asset);
  await assetForUpload(assetId, actor);
  if (!cloudPhotos()) throw new CommunityError(400, 'Upload the file before completing it.');
  const metadata = await head(asset.pathname).catch(() => null);
  if (!metadata) throw new CommunityError(409, 'The upload is not ready yet. Try completing it again.');
  try {
    if (metadata.size !== Number(asset.size) || metadata.contentType.split(';')[0] !== asset.content_type) throw new CommunityError(400, 'The uploaded file does not match the selected file.');
    const blob = await get(asset.pathname, { access: 'private', useCache: false, ...(asset.type === 'video' ? { headers: { Range: 'bytes=0-63' } } : {}) });
    if (!blob || blob.statusCode !== 200) throw new CommunityError(409, 'The upload is not ready yet.');
    const bytes = await streamBytes(blob.stream, asset.type === 'image' ? CMS_IMAGE_LIMIT : 1024 * 1024);
    await validateFile(asset, bytes);
    await run('UPDATE cms_assets SET ready=1 WHERE id=?', [asset.id]);
    return publicAsset(await getCMSAsset(asset.id));
  } catch (error) {
    // Invalid or incomplete media never becomes publicly readable.
    if (error instanceof CommunityError && error.status === 400) await del(asset.pathname).catch(() => {});
    throw error;
  }
}
export async function cmsAssetIsPublished(assetId: string) { return !!await one('SELECT r.asset_id FROM cms_asset_refs r JOIN cms_documents d ON d.id=r.document_id WHERE r.asset_id=? AND d.published IS NOT NULL LIMIT 1', [assetId]); }
export async function serveCMSAsset(asset: AssetRow, request: Request) {
  const headers = new Headers({ 'Content-Type': asset.content_type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes', 'Content-Disposition': 'inline' });
  const range = request.headers.get('range');
  let start = 0, end = Number(asset.size) - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${asset.size}` } });
    if (!match[1]) { start = Math.max(0, Number(asset.size) - Number(match[2])); }
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= Number(asset.size)) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${asset.size}` } });
  }
  let stream: ReadableStream<Uint8Array> | Uint8Array;
  if (cloudPhotos()) {
    const blob = await get(asset.pathname, { access: 'private', useCache: false, ...(range ? { headers: { Range: `bytes=${start}-${end}` } } : {}) });
    if (!blob || blob.statusCode !== 200) throw new CommunityError(404, 'Media not found.');
    stream = blob.stream;
    if (range && blob.headers.get('content-range')) headers.set('Content-Range', blob.headers.get('content-range')!);
    else if (range) { headers.set('Content-Length', String(asset.size)); return new Response(stream, { status: 200, headers }); }
  } else {
    const bytes = await readFile(localPath(asset)).catch(() => null);
    if (!bytes) throw new CommunityError(404, 'Media not found.');
    stream = new Uint8Array(bytes.subarray(start, end + 1));
    if (range) headers.set('Content-Range', `bytes ${start}-${end}/${asset.size}`);
  }
  headers.set('Content-Length', String(end - start + 1));
  return new Response(stream as BodyInit, { status: range ? 206 : 200, headers });
}
