import { adminRequest, cmsJSON, mutateCMSDocument } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await adminRequest(request, true), body = await cmsJSON(request); return result({ document: await mutateCMSDocument((await context.params).id, body.revision, 'publish', actor) }); }
  catch (error) { return failure(error); }
}
