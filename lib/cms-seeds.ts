import { localCatalog } from '@/lib/catalog';
import { getArticles, storyCover } from '@/lib/blog';
import type { CMSContent, CMSMedia, CMSSeed } from '@/lib/cms-types';
import { pageSeeds } from '@/lib/page-seeds';

const content = (value: Partial<CMSContent>): CMSContent => ({
  title: '', excerpt: '', body: '', media: [], sections: [], seoTitle: '', seoDescription: '', ...value,
});
const productSeeds: CMSSeed[] = localCatalog().map(product => ({
  kind: 'product', slug: product.id,
  content: content({
    title: product.name, excerpt: product.details?.tagline.en || product.description,
    body: product.details?.overview.en || product.description,
    media: product.media.map(media => ({
      type: media.type === 'video' ? 'video' : 'image', src: media.src, alt: media.label,
      ...(media.poster ? { poster: media.poster } : {}), origin: media.origin === 'ai' ? 'ai' : 'original',
    })),
    seoTitle: product.name, seoDescription: product.description,
    ...(product.details ? { product: {
      ingredients: product.details.ingredients, packSize: product.details.packSize, origin: product.details.origin,
      highlights: product.details.highlights.map(item => ({ title: item.title.en, body: item.body.en })),
    } } : {}),
  }),
}));
const articleSeeds: CMSSeed[] = getArticles().map(article => {
  const cover = storyCover(article);
  const media: CMSMedia = { type: 'image', src: cover.src, alt: article.title, origin: cover.ai ? 'ai' : 'original' };
  return { kind: 'article', slug: article.id, content: content({
    title: article.title, excerpt: article.excerpt, body: article.body.join('\n\n'),
    category: article.category, featured: article.featured, media: [media],
    seoTitle: article.title, seoDescription: article.excerpt,
  }) };
});
const eventIdeas = [
  { slug: 'park-play-day', title: 'Park play day', category: 'Meet & play', image: 'park-play.webp', body: 'An easy-going day for a little walk, a good sniff and a few new friends.' },
  { slug: 'grooming-tips', title: 'Grooming & care', category: 'Learn together', image: 'grooming.webp', body: 'A chance to exchange everyday care ideas and learn something new together.' },
  { slug: 'training-and-agility', title: 'Training & agility', category: 'Try something new', image: 'training.webp', body: 'Playful activities for curious dogs and the humans cheering them on.' },
  { slug: 'photo-day-and-picnic', title: 'Photo day & picnic', category: 'Make a little memory', image: 'photo-picnic.webp', body: 'A little sunshine, a favourite companion and a moment worth keeping.' },
];
const eventSeeds: CMSSeed[] = eventIdeas.map(event => ({
  kind: 'event', slug: event.slug,
  content: content({ title: event.title, category: event.category, excerpt: event.body, body: event.body,
    media: [{ type: 'image', src: `/assets/events/${event.image}`, alt: event.title, origin: 'original' }],
    seoTitle: event.title, seoDescription: event.body,
    event: { date: '', endDate: '', location: '', registrationUrl: '', status: 'planned' },
  }),
}));
export const cmsSeeds: CMSSeed[] = [...productSeeds, ...articleSeeds, ...eventSeeds, ...pageSeeds];
