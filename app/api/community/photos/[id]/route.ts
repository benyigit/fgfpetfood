import { sameOrigin, requireMember, currentMember, jsonBody, consentEvent, result, failure, CommunityError, type Photo } from '@/lib/community';
import { one, transaction } from '@/lib/community-db';
import { readPhoto, deletePhoto } from '@/lib/community-storage';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
async function getPhoto(context: Context, includeDeleted = false) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{40}$/.test(id)) throw new CommunityError(404, 'Photo not found.');
  const photo = await one<Photo>('SELECT * FROM photos WHERE id=?', [id]);
  if (!photo || (!includeDeleted && photo.deleted_at)) throw new CommunityError(404, 'Photo not found.');
  return photo;
}
export async function GET(_request: Request, context: Context) {
  try {
    const p = await getPhoto(context);
    if (!p.consent || p.hidden) {
      const member = await currentMember();
      const permittedTeamAccess = member?.role === 'moderator' && (p.consent || p.social_consent);
      if (member?.id !== p.user_id && !permittedTeamAccess) throw new CommunityError(404, 'Photo not found.');
    }
    const bytes = await readPhoto(p.id);
    if (!bytes) throw new CommunityError(404, 'Photo not found.');
    return new Response(bytes as BodyInit, { headers: {
      'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin',
      'Content-Disposition': `inline; filename="happy-tails-${p.id}.webp"`
    } });
  } catch (e) { return failure(e); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const p = await getPhoto(context);
    if (p.user_id !== member.id) throw new CommunityError(404, 'Photo not found.');
    const body = await jsonBody(request);
    if (typeof body.consent !== 'boolean' || typeof body.social_consent !== 'boolean') throw new CommunityError(400, 'Please choose both sharing preferences.');
    await transaction([
      { sql: 'UPDATE photos SET consent=?,social_consent=? WHERE id=? AND user_id=? AND deleted_at IS NULL', values: [Number(body.consent), Number(body.social_consent), p.id, member.id] },
      consentEvent(p.id, member.id, body.consent, 'website'),
      consentEvent(p.id, member.id, body.social_consent, 'social')
    ]);
    return result({ ok: true });
  } catch (e) { return failure(e); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const p = await getPhoto(context, true);
    if (p.user_id !== member.id) throw new CommunityError(404, 'Photo not found.');
    if (!p.deleted_at) await transaction([
      { sql: "UPDATE photos SET consent=0,social_consent=0,deleted_at=?,dog_name='',caption='' WHERE id=? AND user_id=?", values: [Date.now(), p.id, member.id] },
      consentEvent(p.id, member.id, false, 'website'),
      consentEvent(p.id, member.id, false, 'social')
    ]);
    // Revoke access before removing the private blob. A retry can finish cleanup.
    await deletePhoto(p.id);
    return result({ ok: true });
  } catch (e) { return failure(e); }
}
