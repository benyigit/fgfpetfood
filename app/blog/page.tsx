import type { Metadata } from 'next';
import PageView from './page-view';
import { getPublicArticles, publicSiteOrigin } from '@/lib/content-public';
export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata {
  const url = `${publicSiteOrigin()}/blog`;
  const title = 'Blog — FGF Pet Food Bazaar';
  const description = 'Explore the FGF blog: natural chew guides, product stories and everyday moments with dogs.';
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } };
}
export default async function BlogPage() {
  return <PageView articles={await getPublicArticles()} />;
}
