import { communityAvailable, db, id, field, jsonBody, sameOrigin, rateLimit, hashPassword, checkPassword, startSession, endSession, currentMember, result, failure, CommunityError } from '@/lib/community';
export const runtime = 'nodejs';
export async function GET() {
  try {
    return result({
      available: communityAvailable(),
      member: communityAvailable() ? await currentMember() : null
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    const email = field(body.email, 254).toLowerCase();
    const password = body.password;
    if (typeof password !== 'string' || password.length > 128) throw new CommunityError(400, 'Please check the form.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) throw new CommunityError(400, 'Use a valid email and a password of at least 10 characters.');
    rateLimit(`auth-email:${email}`);
    rateLimit(`auth-origin:${request.headers.get('x-forwarded-for') || 'local'}`, 50);
    if (body.mode === 'register') {
      const name = field(body.name, 60);
      if (db().prepare('SELECT id FROM users WHERE email=?').get(email)) throw new CommunityError(409, 'Unable to create this account. Try signing in.');
      const userId = id();
      const hashed = await hashPassword(password);
      db().prepare('INSERT INTO users(id,email,password,name,created_at) VALUES (?,?,?,?,?)').run(userId, email, hashed, name, Date.now());
      await startSession(userId, request);
    } else if (body.mode === 'login') {
      const user = db().prepare('SELECT id,password FROM users WHERE email=?').get(email) as {
        id: string;
        password: string;
      } | undefined;
      const dummy = '00000000000000000000000000000000:' + '00'.repeat(64);
      const valid = await checkPassword(password, user?.password || dummy);
      if (!user || !valid) throw new CommunityError(401, 'Email or password is incorrect.');
      await startSession(user.id, request);
    } else throw new CommunityError(400, 'Please choose sign in or create account.');
    return result({
      member: await currentMember()
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await endSession();
    return result({
      ok: true
    });
  } catch (e) {
    return failure(e);
  }
}
