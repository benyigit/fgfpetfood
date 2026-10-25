import { cmsKind, cmsSlug, getPublishedDocument } from '@/lib/cms';
import { CommunityError, failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ kind: string; slug: string }> }) {
  try { const params = await context.params; const document = await getPublishedDocument(cmsKind(params.kind), cmsSlug(params.slug)); if (!document) return result({ error: 'Content not found.' }, 404); return result({ document }); }
  catch (error) { return error instanceof CommunityError ? failure(error) : result({ error: 'Content is temporarily unavailable.' }, 503); }
}
