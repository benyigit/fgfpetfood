import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, productForStory } from '@/lib/blog';
import { localCatalog } from '@/lib/catalog';
import { BlogReader } from '@/components/blog-reader';
type Props = {
  params: Promise<{
    slug: string;
  }>;
};
export async function generateMetadata({
  params
}: Props): Promise<Metadata> {
  const {
    slug
  } = await params;
  const language = 'en';
  const article = getArticle(slug, language);
  return article ? {
    title: `${article.title} — FGF Pet Food Blog`,
    description: article.excerpt
  } : {
    title: 'Story not found — FGF Pet Food'
  };
}
export default async function ArticlePage({
  params
}: Props) {
  const {
    slug
  } = await params;
  const en = getArticle(slug);
  if (!en) notFound();
  const others = getArticles().filter(article => article.id !== slug);
  const ids = [...others.filter(article => article.category === en.category), ...others.filter(article => article.category !== en.category)].slice(0, 3).map(article => article.id);
  const product = localCatalog().find(item => item.id === productForStory(slug));
  return <BlogReader key={slug} article={{
    en
  }} related={{
    en: ids.map(id => getArticle(id)!)
  }} product={product ? {
    id: product.id,
    name: product.name,
    image: product.media[0]?.src || product.image
  } : undefined} />;
}
