import { adminRequest, cmsJSON } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { generateStudioContent } from '@/lib/ai-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true); return result(await generateStudioContent(await cmsJSON(request), actor)); } catch (error) { return failure(error); }
}
