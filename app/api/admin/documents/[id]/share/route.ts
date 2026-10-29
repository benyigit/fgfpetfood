import { adminRequest, cmsJSON } from '@/lib/cms';
import { copyPreview, copyDocument } from '@/lib/brand-sharing';
import { failure,result } from '@/lib/community';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){try{return result(await copyPreview((await context.params).id,await adminRequest(request)));}catch(error){return failure(error);}}
export async function POST(request:Request,context:Context){try{const actor=await adminRequest(request,true),body=await cmsJSON(request);return result(await copyDocument((await context.params).id,actor,body.sourceRevision,body.targetRevision));}catch(error){return failure(error);}}
