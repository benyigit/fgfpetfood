import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storyCover } from '@/lib/blog';
import { getPublicArticle, getPublicArticles, publicSiteOrigin, applyProductContent } from '@/lib/content-public';
import { localCatalog } from '@/lib/catalog';
import { BlogReader } from '@/components/blog-reader';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublicArticle((await params).slug);
  if (!article) return { title: 'Story not found — FGF', robots: { index: false, follow: false } };
  const url = `${publicSiteOrigin()}/blog/${encodeURIComponent(article.id)}`;
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  const cover = storyCover(article);
  const image = cover.type === 'video' ? cover.poster : cover.src;
  const images = image ? [{ url: new URL(image, publicSiteOrigin()).href, alt: cover.alt || article.title }] : undefined;
  return { title: `${title} — FGF Blog`, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map(image => image.url) },
  };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) notFound();
  const others = (await getPublicArticles()).filter(item => item.id !== slug);
  const related = [...others.filter(item => item.category === article.category), ...others.filter(item => item.category !== article.category)].slice(0, 3);
  const product = (await applyProductContent(localCatalog())).find(item => item.id === article.productId);
  const cover = storyCover(article);
  const image = cover.type === 'video' ? cover.poster : cover.src;
  const url = `${publicSiteOrigin()}/blog/${encodeURIComponent(slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title,
    description: article.excerpt, url, mainEntityOfPage: url, inLanguage: 'en',
    ...(image ? { image: new URL(image, publicSiteOrigin()).href } : {}),
    publisher: { '@type': 'Organization', name: 'FGF Pet Food Bazaar', url: publicSiteOrigin() },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    <BlogReader key={slug} article={{ en: article }} related={{ en: related }} product={product ? {
      id: product.id, name: product.name, image: product.media[0]?.src || product.image,
    } : undefined} /></>;
}
