import { adminRequest, cmsJSON } from '@/lib/cms';
import { prepareCMSAsset } from '@/lib/cms-storage';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true); return result(await prepareCMSAsset(await cmsJSON(request), actor), 201); }
  catch (error) { return failure(error); }
}
