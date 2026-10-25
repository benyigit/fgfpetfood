import { adminRequest } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { refreshSocialDraft } from '@/lib/social-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request: Request, context: {params: Promise<{id:string}>}) {
  try { const actor = await adminRequest(request, true), { id } = await context.params; return result({ draft: await refreshSocialDraft(id, actor) }); } catch (error) { return failure(error); }
}
