import { requireModerator, sameOrigin, jsonBody, field, result, failure, CommunityError } from '@/lib/community';
import { rows, run } from '@/lib/community-db';
export const runtime = 'nodejs';
export async function GET() {
  try {
    await requireModerator();
    const photos = await rows('SELECT id,dog_name,caption,consent,social_consent,hidden,created_at FROM photos WHERE deleted_at IS NULL AND (consent=1 OR social_consent=1) ORDER BY created_at DESC LIMIT 100');
    const withdrawals = await rows("SELECT e.photo_id,e.created_at FROM consent_events e JOIN photos p ON p.id=e.photo_id WHERE e.scope='social' AND e.granted=0 AND p.social_consent=0 AND EXISTS (SELECT 1 FROM consent_events previous WHERE previous.photo_id=e.photo_id AND previous.scope='social' AND previous.granted=1 AND previous.created_at<e.created_at) ORDER BY e.created_at DESC LIMIT 100");
    return result({ photos, withdrawals });
  } catch (e) { return failure(e); }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    await requireModerator();
    const body = await jsonBody(request);
    const id = field(body.id, 40);
    if (!/^[a-f0-9]{40}$/.test(id) || typeof body.hidden !== 'boolean') throw new CommunityError(400, 'Please choose a photo.');
    // The team can hide a gallery photo, but can never grant consent for a member.
    await run('UPDATE photos SET hidden=? WHERE id=? AND consent=1 AND deleted_at IS NULL', [Number(body.hidden), id]);
    return result({ ok: true });
  } catch (e) { return failure(e); }
}
