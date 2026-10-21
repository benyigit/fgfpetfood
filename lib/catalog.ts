import { products } from '@/data/products';
import detailData from '@/data/catalog-details.json';
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
      media: details.media,
      details,
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
