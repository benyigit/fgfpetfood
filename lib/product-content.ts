import type { CMSContent } from '@/lib/cms-types';
import type { CatalogProduct, Media } from '@/lib/catalog';

/** Shared editorial projection for the public shop and private unsaved previews. */
export function applyProductEditorial(product: CatalogProduct, content: CMSContent): CatalogProduct {
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
}
