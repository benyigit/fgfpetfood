import sharp from 'sharp';
import { id, field, sameOrigin, requireMember, limitedBody, rateLimit, consentEvent, result, failure, CommunityError } from '@/lib/community';
import { one, rows, transaction } from '@/lib/community-db';
import { savePhoto, deletePhoto } from '@/lib/community-storage';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET() {
  try {
    const member = await requireMember();
    return result({ photos: await rows('SELECT id,dog_name,title,category,caption,consent,social_consent,hidden,created_at FROM photos WHERE user_id=? AND deleted_at IS NULL ORDER BY created_at DESC', [member.id]) });
  } catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  let savedId = '';
  try {
    sameOrigin(request);
    const member = await requireMember();
    await rateLimit(`upload:${member.id}`, 20);
    const count = await one<{ count: number }>('SELECT COUNT(*) as count FROM photos WHERE user_id=? AND deleted_at IS NULL', [member.id]);
    if (count && count.count >= 20) throw new CommunityError(400, 'Your album holds up to 20 photos. Remove one to add another.');
    // The client compresses an original up to 8 MB before the Vercel request.
    const body = await limitedBody(request, 4 * 1024 * 1024);
    const data = await new Response(new Uint8Array(body), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const file = data.get('photo');
    if (!(file instanceof File) || file.size > 3.5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new CommunityError(400, 'Choose a JPG, PNG or WebP photo. Please try a smaller image.');
    const dogName = field(data.get('dog_name'), 40);
    const caption = field(data.get('caption'), 240);
    const title = field(data.get('title') || '', 80, false);
    const category = field(data.get('category') || 'community', 20);
    if (!['cosy', 'outdoors', 'funny', 'community'].includes(category)) throw new CommunityError(400, 'Please choose a moment category.');
    const consent = data.get('consent') === 'true';
    const socialConsent = data.get('social_consent') === 'true';
    const photoId = id();
    let image: Buffer;
    try {
      image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 30000000 }).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { throw new CommunityError(400, 'We could not read this photo. Please choose another image.'); }
    await savePhoto(photoId, image);
    savedId = photoId;
    await transaction([
      { sql: 'INSERT INTO photos(id,user_id,dog_name,title,category,caption,consent,social_consent,created_at) VALUES (?,?,?,?,?,?,?)', values: [photoId, member.id, dogName, title, category, caption, Number(consent), Number(socialConsent), Date.now()] },
      consentEvent(photoId, member.id, consent, 'website'),
      consentEvent(photoId, member.id, socialConsent, 'social')
    ]);
    savedId = '';
    return result({ ok: true, id: photoId, photo: { id: photoId, dog_name: dogName, title, category, caption } }, 201);
  } catch (e) {
    if (savedId) await deletePhoto(savedId).catch(() => {});
    return failure(e);
  }
}
