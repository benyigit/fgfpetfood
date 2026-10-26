import type { CMSContent, CMSSection } from '@/lib/cms-types';
import { products } from '@/data/products';
import detailData from '@/data/catalog-details.json';
import { localPriceSnapshot, type PriceSnapshot } from '@/lib/price-snapshot';
export type Localized = {
  en: string;
};
export type Media = {
  type: string;
  src: string;
  label: string;
  origin: string;
  poster?: string;
  source?: string;
};
export type Details = {
  ingredients: string;
  packSize: string;
  analysis: number[];
  barcode: string;
  origin: string;
  tagline: Localized;
  overview: Localized;
  highlights: {
    title: Localized;
    body: Localized;
  }[];
  media: Media[];
};
export type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
};
export type CatalogProduct = {
  id: string;
  shopifyHandle?: string;
  shopifyProductId?: string;
  /** All packs are temporarily withheld until the merchant confirms their price. */
  priceReviewRequired?: boolean;
  /** Dated display-only price; never used for ordering or availability. */
  priceSnapshot?: PriceSnapshot;
  cmsSections?: CMSSection[];
  cmsProduct?: CMSContent['product'];
  subtitle?: string;
  excerpt?: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  name: string;
  kind: string;
  group: string;
  image: string;
  description: string;
  media: Media[];
  details?: Details;
  variants: Variant[];
  connected: boolean;
};
export function localCatalog(): CatalogProduct[] {
  return products.map(p => {
    const details = (detailData as Record<string, Details>)[p.id];
    return {
      ...p,
      media: details?.media || [{ type: 'image', src: p.image, label: p.name, origin: 'original' }],
      details,
      priceSnapshot: localPriceSnapshot(p.id),
      variants: [],
      connected: false
    };
  });
}
export function money(price: Variant['price'], locale = 'en') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currencyCode
  }).format(Number(price.amount));
}
