import { createHash } from 'node:crypto';
import { cmsJSON } from '@/lib/cms';
import { CommunityError, field, failure, id, rateLimit, result, sameOrigin } from '@/lib/community';
import { one } from '@/lib/community-db';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    await rateLimit(`contact:ip:${ip}`, 12, 60 * 60 * 1000);
    const body = await cmsJSON(request);
    if (typeof body.website === 'string' && body.website.trim()) return result({ ok: true, message: 'Thank you for getting in touch.' }, 201);
    const name = field(body.name, 80), email = field(body.email, 254).toLowerCase(), subject = field(body.subject ?? body.topic ?? '', 100, false), message = field(body.message, 5000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CommunityError(400, 'Enter a valid email address.');
    const requestId = field(body.requestId, 80);
    if (!/^[a-zA-Z0-9-]{20,80}$/.test(requestId)) throw new CommunityError(400, 'Refresh the form and try again.');
    const requestKey = createHash('sha256').update(requestId).digest('hex');
    const previous = await one<{ id: string; name: string; email: string; subject: string; message: string }>('SELECT id,name,email,subject,message FROM cms_inbox WHERE request_key=?', [requestKey]);
    if (previous) {
      if (previous.name !== name || previous.email !== email || previous.subject !== subject || previous.message !== message) throw new CommunityError(409, 'Start a new message before changing this submission.');
      return result({ ok: true, reference: previous.id, message: 'Your message has reached our team.' });
    }
    await rateLimit(`contact:email:${email}`, 6, 60 * 60 * 1000);
    const messageId = id();
    const saved = await one<{ id: string }>('INSERT INTO cms_inbox(id,request_key,name,email,subject,message,status,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING RETURNING id', [messageId, requestKey, name, email, subject, message, 'unread', Date.now()]);
    if (!saved) {
      const existing = await one<{ id: string; name: string; email: string; subject: string; message: string }>('SELECT id,name,email,subject,message FROM cms_inbox WHERE request_key=?', [requestKey]);
      if (!existing) throw new Error('Contact persistence failed');
      if (existing.name !== name || existing.email !== email || existing.subject !== subject || existing.message !== message) throw new CommunityError(409, 'Start a new message before changing this submission.');
      return result({ ok: true, reference: existing.id, message: 'Your message has reached our team.' });
    }
    return result({ ok: true, reference: saved.id, message: 'Your message has reached our team.' }, 201);
  } catch (error) { return failure(error); }
}
