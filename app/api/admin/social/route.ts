import { adminRequest, cmsJSON } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { createSocialDraft, listSocialDrafts } from '@/lib/social-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result(await listSocialDrafts()); } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true); return result({ draft: await createSocialDraft(await cmsJSON(request), actor) }, 201); } catch (error) { return failure(error); }
}
