import { adminRequest, cmsAudit } from '@/lib/cms';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result({ events: await cmsAudit() }); }
  catch (error) { return failure(error); }
}
