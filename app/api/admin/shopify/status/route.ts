import { adminRequest } from '@/lib/cms';
import { failure, result } from '@/lib/community';
import { getShopifyAdminStatus } from '@/lib/shopify-admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { await adminRequest(request); return result({ connection: await getShopifyAdminStatus() }); }
  catch (error) { return failure(error); }
}
