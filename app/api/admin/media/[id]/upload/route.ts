import { cloudPhotos } from '@/lib/community-storage';
import { adminRequest } from '@/lib/cms';
import { assetForUpload, saveLocalCMSAsset } from '@/lib/cms-storage';
import { CommunityError, failure, limitedBody, result } from '@/lib/community';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await adminRequest(request, true); if (cloudPhotos() || process.env.VERCEL) throw new CommunityError(400, 'Use the direct upload for this site.'); const asset = await assetForUpload((await context.params).id, actor); return result({ asset: await saveLocalCMSAsset(asset, await limitedBody(request, Number(asset.size))) }); }
  catch (error) { return failure(error); }
}
