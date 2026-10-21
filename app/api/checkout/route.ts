import { checkout } from '@/lib/shopify';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({
    error: 'Request not allowed.'
  }, {
    status: 403
  });
  try {
    const body = await request.json();
    if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 50) throw new Error('Please check your bag.');
    const lines = body.lines.map((l: {
      merchandiseId: string;
      quantity: number;
    }) => {
      if (typeof l.merchandiseId !== 'string' || !l.merchandiseId.startsWith('gid://shopify/ProductVariant/') || !/^\d+$/.test(l.merchandiseId.split('/').pop() || '') || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 20) throw new Error('Please check your bag.');
      return {
        merchandiseId: l.merchandiseId,
        quantity: l.quantity
      };
    });
    return Response.json({
      url: await checkout(lines)
    });
  } catch (e) {
    return Response.json({
      error: e instanceof Error ? e.message : 'Checkout is not available.'
    }, {
      status: 400
    });
  }
}
