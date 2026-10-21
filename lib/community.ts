import { consentCopy, socialConsentCopy } from './community-consent';
import { cloudDatabase, one, run, type Statement } from './community-db';
import { cloudPhotos } from './community-storage';
import 'server-only';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, {
  N: 131072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024
}, (error, key) => error ? reject(error) : resolve(key)));
export const CONSENT_VERSION = 'sharing-v2';
export const CONSENT_TEXT = consentCopy.en;
export const cookieName = 'fgfpetfood_community';
export class CommunityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export function communityAvailable() {
  if (cloudDatabase() && cloudPhotos()) return true;
  return !process.env.VERCEL && (process.env.NODE_ENV !== 'production' || !!process.env.COMMUNITY_DATA_DIR);
}
export const id = () => randomBytes(20).toString('hex');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export type Member = {
  id: string;
  email: string;
  name: string;
  dog_name: string;
  breed: string;
  role: string;
};
export type Photo = {
  id: string;
  user_id: string;
  dog_name: string;
  caption: string;
  consent: number;
  social_consent: number;
  hidden: number;
  deleted_at: number | null;
  created_at: number;
};
export async function currentMember(): Promise<Member | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return await one<Member>('SELECT u.id,u.email,u.name,u.dog_name,u.breed,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?', [hash(token), Date.now()]) || null;
}
export async function requireMember() {
  const m = await currentMember();
  if (!m) throw new CommunityError(401, 'Please sign in to continue.');
  return m;
}
export async function startSession(userId: string, request: Request) {
  const token = randomBytes(32).toString('hex');
  await run('DELETE FROM sessions WHERE expires_at < ?', [Date.now()]);
  await run('INSERT INTO sessions VALUES (?,?,?)', [hash(token), userId, Date.now() + 7 * 86400000]);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: new URL(process.env.COMMUNITY_ORIGIN || request.url).protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86400
  });
}
export async function endSession() {
  const c = await cookies();
  const token = c.get(cookieName)?.value;
  if (token) await run('DELETE FROM sessions WHERE token_hash=?', [hash(token)]);
  c.delete(cookieName);
}
export function sameOrigin(request: Request) {
  const expected = new URL(process.env.COMMUNITY_ORIGIN || request.url);
  const allowed = new Set([expected.origin]);
  // Next's development request URL can use localhost while the browser uses 127.0.0.1.
  // Only loopback aliases on this same port/protocol are equivalent in development.
  const loopback = ['localhost', '127.0.0.1', '[::1]'];
  if (process.env.NODE_ENV === 'development' && !process.env.COMMUNITY_ORIGIN && loopback.includes(expected.hostname)) {
    for (const hostname of loopback) {
      const alias = new URL(expected.origin);
      alias.hostname = hostname;
      allowed.add(alias.origin);
    }
  }
  if (!allowed.has(request.headers.get('origin') || '')) throw new CommunityError(403, 'Request not allowed.');
}
export async function rateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const k = hash(key);
  const r = await one<{ hits: number }>(`INSERT INTO rate_limits(key,hits,reset_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET
      hits=CASE WHEN rate_limits.reset_at < ? THEN 1 ELSE rate_limits.hits+1 END,
      reset_at=CASE WHEN rate_limits.reset_at < ? THEN ? ELSE rate_limits.reset_at END RETURNING hits`,
    [k, now + windowMs, now, now, now + windowMs]);
  if (!r || r.hits > limit) throw new CommunityError(429, 'Too many attempts. Please try again in 15 minutes.');
}
export async function requireModerator() {
  const member = await requireMember();
  if (member.role !== 'moderator') throw new CommunityError(403, 'This area is for the brand team.');
  return member;
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `${salt}:${key.toString('hex')}`;
}
export async function checkPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  const key = await derive(password, salt);
  return timingSafeEqual(key, Buffer.from(expected, 'hex'));
}
export async function limitedBody(request: Request, max = 12000) {
  const reader = request.body?.getReader();
  if (!reader) throw new CommunityError(400, 'Empty request.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {
      value,
      done
    } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new CommunityError(413, 'The upload is too large.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request) {
  try {
    return JSON.parse((await limitedBody(request)).toString());
  } catch (e) {
    if (e instanceof CommunityError) throw e;
    throw new CommunityError(400, 'Please check the form.');
  }
}
export function field(value: unknown, max: number, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || required && !value.trim()) throw new CommunityError(400, 'Please check the form.');
  return value.trim();
}
export function result(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store'
    }
  });
}
export function failure(error: unknown) {
  if (error instanceof CommunityError) return result({
    error: error.message
  }, error.status);
  console.error('Community request failed:', error instanceof Error ? error.name : 'Unknown error');
  return result({
    error: 'Something went wrong. Please try again.'
  }, 500);
}
export function consentEvent(photoId: string, userId: string, granted: boolean, scope: 'website' | 'social'): Statement {
  return {
    sql: 'INSERT INTO consent_events(photo_id,user_id,granted,scope,version,text,created_at) VALUES (?,?,?,?,?,?,?)',
    values: [photoId, userId, Number(granted), scope, CONSENT_VERSION, scope === 'website' ? consentCopy.en : socialConsentCopy.en, Date.now()]
  };
}
