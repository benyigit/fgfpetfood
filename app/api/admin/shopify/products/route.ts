import { adminRequest, cmsJSON } from '@/lib/cms';
import { failure, result, rateLimit } from '@/lib/community';
import { createShopifyDraft, ShopifyAdminError } from '@/lib/shopify-admin';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try { const actor = await adminRequest(request, true); await rateLimit(`shopify-create:${actor.id}`, 20); return result(await createShopifyDraft(await cmsJSON(request), actor), 201); }
  catch (error) { return error instanceof ShopifyAdminError ? result({ error: error.message, code: error.code }, error.status) : failure(error); }
}
