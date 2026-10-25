import { currentMember } from '@/lib/community';
import { getSitePages } from '@/lib/page-content';
import { getCatalog } from '@/lib/shopify';
import { localCatalog } from '@/lib/catalog';
import { getPublicArticles } from '@/lib/content-public';
import { AdminPreviewRuntime, AdminPreviewUnavailable } from '@/components/admin-preview-runtime';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Private website preview', robots: { index: false, follow: false } };

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const channel = (await searchParams).channel || '';
  if (!/^[a-z0-9-]{36}$/i.test(channel)) return <AdminPreviewUnavailable channel="" />;
  // The iframe never obtains a draft or even its supporting data without exact admin access.
  const member = await currentMember().catch(() => null);
  if (!member || member.role !== 'admin') return <AdminPreviewUnavailable channel={channel} />;
  const [products, articles, pages] = await Promise.allSettled([getCatalog(), getPublicArticles(), getSitePages()]);
  return <AdminPreviewRuntime channel={channel} products={products.status === 'fulfilled' ? products.value : localCatalog()} articles={articles.status === 'fulfilled' ? articles.value : []} pages={pages.status === 'fulfilled' ? pages.value : []} />;
}
