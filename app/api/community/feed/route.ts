import { communityAvailable, db, result, failure } from '@/lib/community';
export const runtime = 'nodejs';
export async function GET() {
  try {
    if (!communityAvailable()) return result({
      photos: []
    });
    return result({
      photos: db().prepare('SELECT id,dog_name,caption FROM photos WHERE consent=1 ORDER BY created_at DESC LIMIT 30').all()
    });
  } catch (e) {
    return failure(e);
  }
}
