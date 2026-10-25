import { adminRequest } from '@/lib/cms';
import { failure, result, rateLimit } from '@/lib/community';
import { importShopifyProducts, ShopifyAdminError } from '@/lib/shopify-admin';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true); await rateLimit(`shopify-import:${actor.id}`, 20); return result(await importShopifyProducts(actor)); }
  catch (error) { return error instanceof ShopifyAdminError ? result({ error: error.message, code: error.code }, error.status) : failure(error); }
}
