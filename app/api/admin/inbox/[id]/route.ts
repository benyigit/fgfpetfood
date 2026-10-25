import { adminRequest, cmsJSON, updateInbox } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await adminRequest(request, true); const body = await cmsJSON(request); await updateInbox((await context.params).id, body.status); return result({ ok: true }); }
  catch (error) { return failure(error); }
}
