import { adminRequest, cmsJSON } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { updateSocialDraft } from '@/lib/social-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function PATCH(request: Request, context: {params: Promise<{id:string}>}) {
  try { const actor = await adminRequest(request, true), { id } = await context.params; return result({ draft: await updateSocialDraft(id, await cmsJSON(request), actor) }); } catch (error) { return failure(error); }
}
