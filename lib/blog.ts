import english from '@/data/articles.json';
export type BlogArticle = (typeof english)[number];
export type StoryBlock = {
  type: 'paragraph';
  text: string;
} | {
  type: 'table';
  headers: string[];
  rows: string[][];
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
  const product = presentation[article.id]?.product;
  const ai = article.image.includes('/products/') && !!product;
  return {
    src: ai ? `/assets/catalog/${product}/lifestyle-ai.webp` : `/${article.image}`,
    ai
  };
}
export function productForStory(id: string) {
  return presentation[id]?.product;
}

// Paragraph indices refer to the supplied article text; source paragraphs are retained.
export function storySections(article: BlogArticle, language: 'en') {
  const sections: StorySection[] = [{
    id: 'introduction',
    title: 'A little introduction',
    blocks: []
  }];
  const config = presentation[article.id];
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
    } else if (true) {
      sections.push({
        id: `section-${index}`,
        title: text,
        blocks: []
      });
    } else {
      sections.at(-1)!.blocks.push({
        type: 'paragraph',
        text
      });
    }
  }
  return sections.filter(section => section.blocks.length > 0);
}
