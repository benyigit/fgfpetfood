import { adminRequest, cmsInbox } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result({ messages: await cmsInbox() }); }
  catch (error) { return failure(error); }
}
