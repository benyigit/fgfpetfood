import { consentCopy } from './community-consent';
import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, {
  N: 131072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024
}, (error, key) => error ? reject(error) : resolve(key)));
export const CONSENT_VERSION = 'gallery-v1';
export const CONSENT_TEXT = consentCopy.en;
export const cookieName = 'fgfpetfood_community';
export class CommunityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
let instance: DatabaseSync | undefined;
export function communityAvailable() {
  return !process.env.VERCEL && (process.env.NODE_ENV !== 'production' || !!process.env.COMMUNITY_DATA_DIR);
}
export function dataDir() {
  if (process.env.VERCEL) throw new CommunityError(503, 'Community storage needs to be connected before online accounts open.');
  if (process.env.NODE_ENV === 'production' && !process.env.COMMUNITY_DATA_DIR) throw new CommunityError(503, 'Community storage is not configured.');
  return path.resolve(/* turbopackIgnore: true */process.env.COMMUNITY_DATA_DIR || '.community');
}
export function db() {
  if (instance) return instance;
  const dir = dataDir();
  mkdirSync(dir, {
    recursive: true,
    mode: 0o700
  });
  mkdirSync(path.join(dir, 'photos'), {
    recursive: true,
    mode: 0o700
  });
  const file = path.join(dir, 'community.sqlite');
  const database = new DatabaseSync(file);
  chmodSync(file, 0o600);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,dog_name TEXT NOT NULL DEFAULT '',breed TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,dog_name TEXT NOT NULL,caption TEXT NOT NULL,consent INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS consent_events(id INTEGER PRIMARY KEY,photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,granted INTEGER NOT NULL,version TEXT NOT NULL,text TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,reset_at INTEGER NOT NULL);`);
  instance = database;
  return database;
}
export const id = () => randomBytes(20).toString('hex');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export type Member = {
  id: string;
  email: string;
  name: string;
  dog_name: string;
  breed: string;
};
export type Photo = {
  id: string;
  user_id: string;
  dog_name: string;
  caption: string;
  consent: number;
  created_at: number;
};
export async function currentMember(): Promise<Member | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const d = db();
  d.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  return d.prepare('SELECT u.id,u.email,u.name,u.dog_name,u.breed FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token), Date.now()) as Member | undefined || null;
}
export async function requireMember() {
  const m = await currentMember();
  if (!m) throw new CommunityError(401, 'Please sign in to continue.');
  return m;
}
export async function startSession(userId: string, request: Request) {
  const token = randomBytes(32).toString('hex');
  db().prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), userId, Date.now() + 7 * 86400000);
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
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
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
export function rateLimit(key: string, limit = 10, windowMs = 15 * 60 * 1000) {
  const d = db();
  const now = Date.now();
  d.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);
  const k = hash(key);
  d.prepare('INSERT INTO rate_limits(key,hits,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1').run(k, now + windowMs);
  const r = d.prepare('SELECT hits FROM rate_limits WHERE key=?').get(k) as {
    hits: number;
  };
  if (r.hits > limit) throw new CommunityError(429, 'Too many attempts. Please try again in 15 minutes.');
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
export function consentEvent(photoId: string, userId: string, granted: boolean, language = 'en') {
  db().prepare('INSERT INTO consent_events(photo_id,user_id,granted,version,text,created_at) VALUES (?,?,?,?,?,?)').run(photoId, userId, Number(granted), CONSENT_VERSION, CONSENT_TEXT, Date.now());
}
