import 'server-only';
import { cache } from 'react';
import { getPublicCMSState } from '@/lib/cms';
import { articleFromPublished, type BlogArticle } from '@/lib/blog';
import { applyProductEditorial } from '@/lib/product-content';
import type { CatalogProduct } from '@/lib/catalog';

export const getPublicArticles = cache(async (): Promise<BlogArticle[]> => {
  const state = await getPublicCMSState('article');
  return state.documents.map(articleFromPublished);
});
export const getPublicArticle = cache(async (slug: string) => (await getPublicArticles()).find(article => article.id === slug));
export const getPublicEvents = cache(async () => (await getPublicCMSState('event')).documents.sort((a, b) => Number(!!b.content.featured) - Number(!!a.content.featured)));
export const getPublicEvent = cache(async (slug: string) => (await getPublicEvents()).find(document => document.slug === slug));
export const getPublicPage = cache(async (slug: string) => (await getPublicCMSState('page')).documents.find(document => document.slug === slug));
export function publicSiteOrigin() {
  try {
    const url = new URL(process.env.SITE_URL || 'https://fgfpetfood.vercel.app');
    if (url.protocol === 'https:' && !url.username && !url.password) return url.origin;
  } catch {}
  return 'https://fgfpetfood.vercel.app';
}

export async function applyProductContent(products: CatalogProduct[]): Promise<CatalogProduct[]> {
  const state = await getPublicCMSState('product');
  const hidden = new Set(state.hiddenSlugs);
  const published = new Map(state.documents.map(document => [document.slug, document.content]));
  return products.filter(product => !hidden.has(product.id)).map(product => {
    const content = published.get(product.id);
    if (!content) return product;
    return applyProductEditorial(product, content);
  }).sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}
