import 'server-only';
import type { Variant } from '@/lib/catalog';

// These three prices were identified as unconfirmed during the merchant review.
// Keep the policy narrow: a later price change automatically makes the pack eligible.
const reviewProductIds = new Set([
  'gid://shopify/Product/9605838536963', // Collagen Stick 6 inch
  'gid://shopify/Product/9574630260995', // Beef Lung
  'gid://shopify/Product/9558887039235', // Chicken Feet
]);

export function requiresPriceReview(storeDomain: string, productId: string, price: Variant['price']) {
  return storeDomain === 'sn12b8-ng.myshopify.com' && reviewProductIds.has(productId)
    && price.currencyCode === 'USD' && Number(price.amount) === 1;
}
