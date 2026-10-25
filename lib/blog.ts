import english from '@/data/articles.json';
import type { CMSMedia, CMSPublished } from '@/lib/cms-types';
export type BlogArticle = (typeof english)[number] & {
  subtitle?: string;
  media?: CMSMedia[];
  sections?: StorySection[];
  seoTitle?: string;
  seoDescription?: string;
  sourcePresentation?: boolean;
  productId?: string;
};
export type StoryBlock = {
  type: 'paragraph';
  text: string;
} | {
  type: 'table';
  headers: string[];
  rows: string[][];
} | {
  type: 'media';
  media: CMSMedia;
};
export type StorySection = {
  id: string;
  title: string;
  blocks: StoryBlock[];
};
type Presentation = {
  product: string;
  headings: number[];
  table?: {
    start: number;
    end: number;
    compare?: boolean;
  };
};
const presentation: Record<string, Presentation> = {
  'bully-stick-6': {
    product: 'bully-stick-6',
    headings: [38, 41, 46]
  },
  'braided-collagen-stick-6': {
    product: 'braided-collagen-stick',
    headings: [35, 41]
  },
  'beef-trachea': {
    product: 'beef-trachea',
    headings: [28, 33]
  },
  'beef-lung': {
    product: 'beef-lung',
    headings: [2, 7]
  },
  'chicken-feet': {
    product: 'chicken-feet',
    headings: [60, 87, 93, 99],
    table: {
      start: 62,
      end: 83
    }
  },
  'cow-ear-7-benefits': {
    product: 'cow-ear',
    headings: [0, 55, 80, 85, 92],
    table: {
      start: 57,
      end: 76
    }
  },
  'bully-stick-12': {
    product: 'bully-stick-12',
    headings: [85, 91],
    table: {
      start: 51,
      end: 76,
      compare: true
    }
  },
  'collagen-stick-6': {
    product: 'collagen-stick-6',
    headings: [86, 92],
    table: {
      start: 51,
      end: 76,
      compare: true
    }
  },
  'cow-ear-natural': {
    product: 'cow-ear',
    headings: [70]
  },
  'lamb-ear': {
    product: 'lamb-ear',
    headings: [68, 92, 99],
    table: {
      start: 73,
      end: 90
    }
  },
  'lamb-tripe-7-benefits': {
    product: 'lamb-tripe',
    headings: [0, 68, 87, 94, 97],
    table: {
      start: 70,
      end: 85
    }
  },
  'lamb-tripe-flavor': {
    product: 'lamb-tripe',
    headings: [68, 94],
    table: {
      start: 70,
      end: 89
    }
  }
};
export function getArticles(language: 'en' = 'en'): BlogArticle[] {
  return english;
}
export function getArticle(id: string, language: 'en' = 'en') {
  return getArticles(language).find(article => article.id === id);
}
export function readingMinutes(article: BlogArticle) {
  return Math.max(1, Math.ceil(article.body.join(' ').split(/\s+/).length / 210));
}
export function storyCover(article: BlogArticle) {
  const media = article.media?.[0];
  if (media) return { ...media, ai: media.origin === 'ai' };
  if (article.media) return { type: 'image' as const, src: '', alt: article.title, ai: false, poster: undefined as string | undefined };
  const product = presentation[article.id]?.product;
  const usePackPhoto = ['bully-stick-12', 'collagen-stick-6'].includes(article.id);
  const generatedProductScene = article.image.includes('/products/') && !!product && !usePackPhoto;
  const ai = generatedProductScene || article.image.includes('/stories/');
  return {
    type: 'image' as const,
    src: usePackPhoto && product ? `/assets/catalog/${product}/front.webp` : generatedProductScene ? `/assets/catalog/${product}/lifestyle-ai.webp` : article.image.startsWith('/') || /^https:\/\//.test(article.image) ? article.image : `/${article.image}`,
    alt: article.title,
    poster: undefined as string | undefined,
    ai
  };
}
export function productForStory(id: string) {
  return presentation[id]?.product;
}

// Paragraph indices refer to the supplied article text; source paragraphs are retained.
export function storySections(article: BlogArticle, language: 'en' = 'en'): StorySection[] {
  if (article.sections) return article.sections;
  const sections: StorySection[] = [{
    id: 'introduction',
    title: 'A little introduction',
    blocks: []
  }];
  const config = article.sourcePresentation === false ? undefined : presentation[article.id];
  for (let index = 0; index < article.body.length; index++) {
    const text = article.body[index];
    if (config?.table?.start === index) {
      const {
        start,
        end,
        compare
      } = config.table;
      const columns = compare ? 3 : 2;
      const cells = article.body.slice(start + 2, end + 1);
      const rows: string[][] = [];
      for (let cell = 0; cell < cells.length; cell += columns) rows.push(cells.slice(cell, cell + columns));
      sections.at(-1)!.blocks.push({
        type: 'table',
        headers: [...(compare ? ['At a glance'] : []), ...article.body.slice(start, start + 2)],
        rows
      });
      index = end;
    } else if (config?.headings.includes(index) || /^\d+\.\s+\S/.test(text) || /^#{1,3}\s+\S/.test(text)) {
      sections.push({
        id: `section-${index}`,
        title: text.replace(/^#{1,3}\s+/, ''),
        blocks: []
      });
    } else {
      sections.at(-1)!.blocks.push({
        type: 'paragraph',
        text
      });
    }
  }
  return sections.filter(section => section.blocks.length > 0 || section.id !== 'introduction');
}

const paragraphs = (body: string) => body.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
export function articleFromPublished(document: CMSPublished): BlogArticle {
  const content = document.content;
  const original = getArticle(document.slug);
  const sections: StorySection[] | undefined = content.sections.length ? [
    ...(content.body.trim() ? [{ id: 'introduction', title: 'Introduction', blocks: paragraphs(content.body).map(text => ({ type: 'paragraph' as const, text })) }] : []),
    ...content.sections.map((section, index) => ({ id: `section-${index}`, title: section.heading,
      blocks: [...paragraphs(section.body).map(text => ({ type: 'paragraph' as const, text })), ...(section.media ? [{ type: 'media' as const, media: section.media }] : [])],
    })),
  ] : undefined;
  return {
    id: document.slug, title: content.title, category: content.category || 'From the blog',
    subtitle: content.subtitle, excerpt: content.excerpt, image: content.media[0]?.src || '', media: content.media,
    body: [...paragraphs(content.body), ...content.sections.flatMap(section => [section.heading, ...paragraphs(section.body)])],
    featured: content.featured || false, sections,
    sourcePresentation: !!original && content.body === original.body.join('\n\n'),
    productId: productForStory(document.slug), seoTitle: content.seoTitle, seoDescription: content.seoDescription,
  };
}
