import 'server-only';
import { cache } from 'react';
import { getPublicCMSState } from '@/lib/cms';
import { articleFromPublished, type BlogArticle } from '@/lib/blog';
import type { CatalogProduct, Media } from '@/lib/catalog';

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
    const media: Media[] = content.media.map(item => ({ type: item.type, src: item.src, label: item.alt || content.title,
      origin: item.origin || 'original', ...(item.poster ? { poster: item.poster } : {}),
    }));
    const details = product.details ? { ...product.details,
      tagline: { en: content.excerpt }, overview: { en: content.body },
      ...(content.product ? {
        ingredients: content.product.ingredients, packSize: content.product.packSize, origin: content.product.origin,
        highlights: content.product.highlights.map(item => ({ title: { en: item.title }, body: { en: item.body } })),
      } : {}),
    } : undefined;
    // Only editorial fields change. Shopify merchandise, price and availability stay untouched.
    return { ...product, name: content.title, kind: content.category || product.kind,
      subtitle: content.subtitle, excerpt: content.excerpt, featured: !!content.featured,
      cmsSections: content.sections, cmsProduct: content.product, description: content.body || content.excerpt,
      seoTitle: content.seoTitle, seoDescription: content.seoDescription,
      media, image: media.find(item => item.type === 'image')?.src || media.find(item => item.poster)?.poster || '', details,
    };
  }).sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}
