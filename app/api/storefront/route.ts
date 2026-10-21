import { getCatalog, shopConnected } from '@/lib/shopify';
export async function GET() {
  try {
    return Response.json({
      connected: shopConnected(),
      products: await getCatalog()
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return Response.json({
      error: 'The shop is temporarily unavailable.'
    }, {
      status: 503
    });
  }
}
