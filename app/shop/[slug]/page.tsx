import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { buyerIP, getCatalog } from '@/lib/shopify';
import { localCatalog } from '@/lib/catalog';
import { applyProductContent, publicSiteOrigin } from '@/lib/content-public';
import { ProductDetail } from '@/components/product-detail';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
async function catalogForPage(slug: string) {
  try {
    return await getCatalog(buyerIP(await headers()));
  } catch (error) {
    const local = await applyProductContent(localCatalog());
    // Published editorial content remains readable; live purchasing is checked separately.
    if (local.some(product => product.id === slug)) return local;
    if (localCatalog().some(product => product.id === slug)) return local;
    throw error;
  }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await catalogForPage(slug);
  const product = products.find(product => product.id === slug) || products.find(product => product.shopifyHandle === slug);
  if (!product) return { title: 'Product not found — FGF', robots: { index: false, follow: false } };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.description;
  const url = `${publicSiteOrigin()}/shop/${encodeURIComponent(product.id)}`;
  const image = product.media.find(media => media.type === 'image')?.src;
  return {
    title: `${title} | FGF Pet Food Bazaar`, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', ...(image ? { images: [{ url: new URL(image, publicSiteOrigin()).href, alt: product.name }] } : {}) },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const products = await catalogForPage(slug);
  const product = products.find(product => product.id === slug) || products.find(product => product.shopifyHandle === slug);
  if (!product) notFound();
  return <ProductDetail key={product.id} product={product} related={products.filter(item => item.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group))} />;
}
