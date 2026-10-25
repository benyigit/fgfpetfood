import { cmsKind, getPublicCMSState } from '@/lib/cms';
import { CommunityError, failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const value = new URL(request.url).searchParams.get('kind'); return result(await getPublicCMSState(value ? cmsKind(value) : undefined)); }
  catch (error) { return error instanceof CommunityError ? failure(error) : result({ error: 'Content is temporarily unavailable.' }, 503); }
}
