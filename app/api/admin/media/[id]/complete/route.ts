import { adminRequest } from '@/lib/cms';
import { completeCMSAsset } from '@/lib/cms-storage';
import { failure, result } from '@/lib/community';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await adminRequest(request, true); return result({ asset: await completeCMSAsset((await context.params).id, actor) }); }
  catch (error) { return failure(error); }
}
