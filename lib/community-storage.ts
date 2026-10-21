import 'server-only';
import { put, get, del } from '@vercel/blob';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { communityBrand, localDataDir } from './community-db';

export const cloudPhotos = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const pathname = (id: string) => `${communityBrand}/community/${id}.webp`;
const localPath = (id: string) => path.join(localDataDir(), 'photos', `${id}.webp`);
export async function savePhoto(id: string, bytes: Buffer) {
  if (cloudPhotos()) {
    await put(pathname(id), bytes, { access: 'private', contentType: 'image/webp', addRandomSuffix: false, cacheControlMaxAge: 60 });
  } else {
    if (process.env.VERCEL) throw new Error('Private photo storage is not configured');
    await writeFile(localPath(id), bytes, { mode: 0o600, flag: 'wx' });
  }
}
export async function readPhoto(id: string): Promise<ReadableStream | Uint8Array | null> {
  if (cloudPhotos()) {
    const blob = await get(pathname(id), { access: 'private', useCache: false });
    return blob?.statusCode === 200 ? blob.stream : null;
  }
  if (process.env.VERCEL) throw new Error('Private photo storage is not configured');
  return new Uint8Array(await readFile(localPath(id)));
}
export async function deletePhoto(id: string) {
  if (cloudPhotos()) await del(pathname(id));
  else if (!process.env.VERCEL) await unlink(localPath(id)).catch(e => { if (e.code !== 'ENOENT') throw e; });
}
