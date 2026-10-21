import { field, jsonBody, sameOrigin, requireMember, result, failure } from '@/lib/community';
import { run } from '@/lib/community-db';
export const runtime = 'nodejs';
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const member = await requireMember();
    const data = await jsonBody(request);
    await run('UPDATE users SET dog_name=?,breed=? WHERE id=?', [field(data.dog_name, 40, false), field(data.breed, 60, false), member.id]);
    return result({
      member: await requireMember()
    });
  } catch (e) {
    return failure(e);
  }
}
