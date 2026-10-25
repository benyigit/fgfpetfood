import { buyerIP, checkout, ShopError, validateCheckoutLines } from '@/lib/shopify';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Request not allowed.', code: 'INVALID_ORIGIN' }, { status: 403, headers });
  }
  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      throw new ShopError('Please check your bag and try again.', 415, 'INVALID_REQUEST');
    }
    const raw = await request.text();
    if (raw.length > 20000) throw new ShopError('Please check the items in your bag.', 413, 'INVALID_BAG');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new ShopError('Please check your bag and try again.', 400, 'INVALID_REQUEST'); }
    if (!body || typeof body !== 'object' || !('lines' in body)) throw new ShopError('Please check the items in your bag.', 400, 'INVALID_BAG');
    const lines = validateCheckoutLines(body.lines);
    return Response.json({ url: await checkout(lines, buyerIP(request.headers)) }, { headers });
  } catch (error) {
    if (error instanceof ShopError) {
      return Response.json({ error: error.message, code: error.code, ...error.details }, { status: error.status, headers });
    }
    return Response.json({ error: 'Checkout is temporarily unavailable. Please try again.', code: 'SHOP_UNAVAILABLE' }, { status: 503, headers });
  }
}
