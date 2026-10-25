import { adminRequest } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { studioStatus } from '@/lib/ai-studio';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result(studioStatus()); } catch (error) { return failure(error); }
}
