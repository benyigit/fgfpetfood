import { adminRequest, cmsJSON } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { publishSocialDraft } from '@/lib/social-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function POST(request: Request, context: {params: Promise<{id:string}>}) {
  try { const actor = await adminRequest(request, true), { id } = await context.params; return result({ draft: await publishSocialDraft(id, await cmsJSON(request), actor) }); } catch (error) { return failure(error); }
}
