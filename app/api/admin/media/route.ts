import { adminRequest } from '@/lib/cms';
import { listCMSAssets } from '@/lib/cms-storage';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result({ assets: await listCMSAssets() }); }
  catch (error) { return failure(error); }
}
