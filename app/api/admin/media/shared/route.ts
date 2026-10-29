import { adminRequest } from '@/lib/cms';
import { syncBrandAssets } from '@/lib/brand-sharing';
import { failure,result } from '@/lib/community';
export const runtime='nodejs';
export async function POST(request:Request){try{return result(await syncBrandAssets(await adminRequest(request,true)));}catch(error){return failure(error);}}
