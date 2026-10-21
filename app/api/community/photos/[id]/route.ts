import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { db, dataDir, sameOrigin, requireMember, currentMember, jsonBody, consentEvent, result, failure, CommunityError, type Photo } from '@/lib/community';
export const runtime = 'nodejs';
type Context = {
  params: Promise<{
    id: string;
  }>;
};
async function getPhoto(context: Context) {
  const {
    id
  } = await context.params;
  if (!/^[a-f0-9]{40}$/.test(id)) throw new CommunityError(404, 'Photo not found.');
  const photo = db().prepare('SELECT * FROM photos WHERE id=?').get(id) as Photo | undefined;
  if (!photo) throw new CommunityError(404, 'Photo not found.');
  return photo;
}
export async function GET(_request: Request, context: Context) {
  try {
    const p = await getPhoto(context);
    if (!p.consent && (await currentMember())?.id !== p.user_id) throw new CommunityError(404, 'Photo not found.');
    const bytes = await readFile(path.join(dataDir(), 'photos', p.id + '.webp'));
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const p = await getPhoto(context);
    if (p.user_id !== member.id) throw new CommunityError(404, 'Photo not found.');
    const body = await jsonBody(request);
    if (typeof body.consent !== 'boolean') throw new CommunityError(400, 'Please choose a sharing preference.');
    const database = db();
    database.exec('BEGIN IMMEDIATE');
    try {
      database.prepare('UPDATE photos SET consent=? WHERE id=? AND user_id=?').run(Number(body.consent), p.id, member.id);
      consentEvent(p.id, member.id, body.consent, body.language);
      database.exec('COMMIT');
    } catch (e) {
      database.exec('ROLLBACK');
      throw e;
    }
    return result({
      ok: true
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const p = await getPhoto(context);
    if (p.user_id !== member.id) throw new CommunityError(404, 'Photo not found.');
    db().prepare('DELETE FROM photos WHERE id=? AND user_id=?').run(p.id, member.id);
    await unlink(path.join(dataDir(), 'photos', p.id + '.webp')).catch(() => {});
    return result({
      ok: true
    });
  } catch (e) {
    return failure(e);
  }
}
