import { communityAvailable, result, failure } from '@/lib/community';
import { rows } from '@/lib/community-db';
export const runtime = 'nodejs';
export async function GET() {
  try {
    if (!communityAvailable()) return result({
      photos: []
    });
    return result({
      photos: await rows('SELECT id,dog_name,caption FROM photos WHERE consent=1 AND hidden=0 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 30')
    });
  } catch (e) {
    return failure(e);
  }
}
