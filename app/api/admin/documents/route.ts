import { adminRequest, cmsJSON, cmsKind, cmsSlug, createCMSDocument, listCMSDocuments } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); const value = new URL(request.url).searchParams.get('kind'); return result({ documents: await listCMSDocuments(value ? cmsKind(value) : undefined) }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true), body = await cmsJSON(request); return result({ document: await createCMSDocument(cmsKind(body.kind), cmsSlug(body.slug), body.content, actor) }, 201); }
  catch (error) { return failure(error); }
}
