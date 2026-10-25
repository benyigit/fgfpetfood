import { buyerIP, getCatalog, shopConnected } from '@/lib/shopify';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  try {
    return Response.json({ connected: shopConnected(), products: await getCatalog(buyerIP(request.headers)) }, { headers });
  } catch {
    return Response.json({ error: 'The shop is temporarily unavailable. Please try again in a moment.' }, { status: 503, headers });
  }
}
