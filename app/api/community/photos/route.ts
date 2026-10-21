import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { db, id, dataDir, field, sameOrigin, requireMember, limitedBody, rateLimit, consentEvent, result, failure, CommunityError } from '@/lib/community';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const member = await requireMember();
    return result({
      photos: db().prepare('SELECT id,dog_name,caption,consent,created_at FROM photos WHERE user_id=? ORDER BY created_at DESC').all(member.id)
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  let filePath = '';
  try {
    sameOrigin(request);
    const member = await requireMember();
    rateLimit(`upload:${member.id}`, 20);
    const count = db().prepare('SELECT COUNT(*) as count FROM photos WHERE user_id=?').get(member.id) as {
      count: number;
    };
    if (count.count >= 20) throw new CommunityError(400, 'Your album holds up to 20 photos. Remove one to add another.');
    const body = await limitedBody(request, 9 * 1024 * 1024);
    const data = await new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': request.headers.get('content-type') || ''
      }
    }).formData();
    const file = data.get('photo');
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new CommunityError(400, 'Choose a JPG, PNG or WebP photo under 8 MB.');
    const dogName = field(data.get('dog_name'), 40);
    const caption = field(data.get('caption'), 240);
    const consent = data.get('consent') === 'true';
    const photoId = id();
    let image: Buffer;
    try {
      image = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 30000000
      }).rotate().resize(1600, 1600, {
        fit: 'inside',
        withoutEnlargement: true
      }).webp({
        quality: 86
      }).toBuffer();
    } catch {
      throw new CommunityError(400, 'We could not read this photo. Please choose another image.');
    }
    filePath = path.join(dataDir(), 'photos', photoId + '.webp');
    await writeFile(filePath, image, {
      mode: 0o600,
      flag: 'wx'
    });
    const database = db();
    database.exec('BEGIN IMMEDIATE');
    try {
      database.prepare('INSERT INTO photos(id,user_id,dog_name,caption,consent,created_at) VALUES (?,?,?,?,?,?)').run(photoId, member.id, dogName, caption, Number(consent), Date.now());
      consentEvent(photoId, member.id, consent, String(data.get('language')));
      database.exec('COMMIT');
    } catch (e) {
      database.exec('ROLLBACK');
      throw e;
    }
    return result({
      ok: true,
      id: photoId
    }, 201);
  } catch (e) {
    if (filePath) await unlink(filePath).catch(() => {});
    return failure(e);
  }
}
