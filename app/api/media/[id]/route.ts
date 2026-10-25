import { cmsAssetIsPublished, getCMSAsset, serveCMSAsset } from '@/lib/cms-storage';
import { currentMember, CommunityError, failure } from '@/lib/community';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const asset = await getCMSAsset((await context.params).id);
    if (!asset.ready) throw new CommunityError(404, 'Media not found.');
    if (!await cmsAssetIsPublished(asset.id) && (await currentMember())?.role !== 'admin') throw new CommunityError(404, 'Media not found.');
    return serveCMSAsset(asset, request);
  } catch (error) { return failure(error); }
}
