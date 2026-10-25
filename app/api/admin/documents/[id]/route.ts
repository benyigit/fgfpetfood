import { adminRequest, cmsJSON, getCMSDocument, mutateCMSDocument } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { await adminRequest(request); return result({ document: await getCMSDocument((await context.params).id) }); }
  catch (error) { return failure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { const actor = await adminRequest(request, true), body = await cmsJSON(request); return result({ document: await mutateCMSDocument((await context.params).id, body.revision, 'save', actor, body.content) }); }
  catch (error) { return failure(error); }
}
