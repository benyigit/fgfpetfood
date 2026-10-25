import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

// A server-owned namespace keeps the two brands' accounts and permissions separate.
export const communityBrand = 'fgfpetfood';
const connection = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const cloudDatabase = () => Boolean(connection());
export const localDataDir = () => path.resolve(/* turbopackIgnore: true */process.env.COMMUNITY_DATA_DIR || '.community');
type Value = string | number | null;
export type Statement = { sql: string; values?: Value[] };
let local: DatabaseSync | undefined;
let ready: Promise<void> | undefined;
const tableNames = /\b(users|sessions|photos|consent_events|rate_limits|cms_documents|cms_audit|cms_assets|cms_asset_refs|cms_inbox|shopify_draft_requests|cms_inbox_status_created|cms_audit_document_created|studio_requests|social_drafts|social_history|social_attempts)\b/g;
function cloudSQL(sql: string) {
  let i = 0;
  return sql.replace(tableNames, name => `${communityBrand}_${name}`).replace(/\?/g, () => `$${++i}`);
}
function localDB() {
  if (local) return local;
  if (process.env.VERCEL || (process.env.NODE_ENV === 'production' && !process.env.COMMUNITY_DATA_DIR)) throw new Error('Persistent community database is not configured');
  const dir = localDataDir();
  mkdirSync(path.join(dir, 'photos'), { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'community.sqlite');
  local = new DatabaseSync(file);
  chmodSync(file, 0o600);
  local.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  return local;
}
async function initialize() {
  const pg = cloudDatabase();
  const statements = [
    `CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,dog_name TEXT NOT NULL DEFAULT '',breed TEXT NOT NULL DEFAULT '',role TEXT NOT NULL DEFAULT 'member',created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,dog_name TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',category TEXT NOT NULL DEFAULT 'community',caption TEXT NOT NULL,consent INTEGER NOT NULL DEFAULT 0,social_consent INTEGER NOT NULL DEFAULT 0,hidden INTEGER NOT NULL DEFAULT 0,deleted_at BIGINT,created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS consent_events(id ${pg ? 'BIGSERIAL' : 'INTEGER'} PRIMARY KEY,photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,granted INTEGER NOT NULL,scope TEXT NOT NULL DEFAULT 'website',version TEXT NOT NULL,text TEXT NOT NULL,created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,reset_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS shopify_draft_requests(request_key TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,actor_id TEXT NOT NULL,state TEXT NOT NULL,response TEXT,created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS cms_documents(id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,draft TEXT NOT NULL,published TEXT,revision INTEGER NOT NULL DEFAULT 1,updated_at BIGINT NOT NULL,published_at BIGINT,mutation TEXT NOT NULL,UNIQUE(kind,slug))`,
    `CREATE TABLE IF NOT EXISTS cms_audit(id TEXT PRIMARY KEY,document_id TEXT NOT NULL,user_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,revision INTEGER NOT NULL,created_at BIGINT NOT NULL,snapshot TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS cms_assets(id TEXT PRIMARY KEY,pathname TEXT UNIQUE NOT NULL,type TEXT NOT NULL,name TEXT NOT NULL,content_type TEXT NOT NULL,size BIGINT NOT NULL,ready INTEGER NOT NULL DEFAULT 0,created_by TEXT NOT NULL,created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS cms_asset_refs(document_id TEXT NOT NULL REFERENCES cms_documents(id) ON DELETE CASCADE,asset_id TEXT NOT NULL REFERENCES cms_assets(id),PRIMARY KEY(document_id,asset_id))`,
    `CREATE TABLE IF NOT EXISTS cms_inbox(id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'unread',created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS studio_requests(request_key TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,actor_id TEXT NOT NULL,state TEXT NOT NULL,result TEXT,error TEXT NOT NULL DEFAULT '',created_at BIGINT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS social_drafts(id TEXT PRIMARY KEY,platform TEXT NOT NULL,caption TEXT NOT NULL,media_src TEXT NOT NULL,media_alt TEXT NOT NULL,source_product_id TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',generated INTEGER NOT NULL DEFAULT 0,created_by TEXT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,published_at BIGINT,published_url TEXT NOT NULL DEFAULT '',error TEXT NOT NULL DEFAULT '',mutation TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS social_history(id TEXT PRIMARY KEY,draft_id TEXT NOT NULL,action TEXT NOT NULL,actor_name TEXT NOT NULL,actor_id TEXT NOT NULL,created_at BIGINT NOT NULL,detail TEXT NOT NULL,snapshot TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS social_attempts(id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,draft_id TEXT NOT NULL,revision INTEGER NOT NULL,account_id TEXT NOT NULL,platform TEXT NOT NULL,state TEXT NOT NULL,container_id TEXT NOT NULL DEFAULT '',external_id TEXT NOT NULL DEFAULT '',error TEXT NOT NULL DEFAULT '',created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS cms_inbox_status_created ON cms_inbox(status,created_at)`,
    `CREATE INDEX IF NOT EXISTS cms_audit_document_created ON cms_audit(document_id,created_at)`
  ];
  if (pg) {
    const sql = neon(connection()!);
    await sql.transaction([
      ...statements,
      "ALTER TABLE photos ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE photos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'community'"
    ].map(s => sql.query(cloudSQL(s), [])));
  } else {
    const db = localDB();
    statements.forEach(s => db.exec(s));
    for (const [table, column, definition] of [
      ['photos', 'title', "TEXT NOT NULL DEFAULT ''"],
      ['photos', 'category', "TEXT NOT NULL DEFAULT 'community'"],
      ['users', 'role', "TEXT NOT NULL DEFAULT 'member'"],
      ['photos', 'social_consent', 'INTEGER NOT NULL DEFAULT 0'],
      ['photos', 'hidden', 'INTEGER NOT NULL DEFAULT 0'],
      ['photos', 'deleted_at', 'BIGINT'],
      ['consent_events', 'scope', "TEXT NOT NULL DEFAULT 'website'"]
    ]) {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (!columns.some(c => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}
export async function initializeCommunity() {
  if (!ready) ready = initialize().catch(e => { ready = undefined; throw e; });
  await ready;
}
function normalize<T>(row: Record<string, unknown>): T {
  for (const key of ['created_at', 'expires_at', 'reset_at', 'deleted_at', 'count']) {
    if (row[key] != null) row[key] = Number(row[key]);
  }
  return row as T;
}
export async function rows<T = Record<string, unknown>>(query: string, values: Value[] = []): Promise<T[]> {
  await initializeCommunity();
  const result = cloudDatabase()
    ? await neon(connection()!).query(cloudSQL(query), values)
    : localDB().prepare(query).all(...values);
  return result.map(row => normalize<T>(row));
}
export async function one<T = Record<string, unknown>>(query: string, values: Value[] = []): Promise<T | undefined> {
  return (await rows<T>(query, values))[0];
}
export async function transaction(statements: Statement[]) {
  await initializeCommunity();
  if (cloudDatabase()) {
    const sql = neon(connection()!);
    await sql.transaction(statements.map(s => sql.query(cloudSQL(s.sql), s.values || [])));
    return;
  }
  const db = localDB();
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const s of statements) db.prepare(s.sql).run(...(s.values || []));
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export async function run(sql: string, values: Value[] = []) { await transaction([{ sql, values }]); }
