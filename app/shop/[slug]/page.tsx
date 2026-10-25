import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { buyerIP, getCatalog } from "@/lib/shopify";
import { localCatalog } from "@/lib/catalog";
import { ProductDetail } from "@/components/product-detail";

async function catalogForPage(slug: string) {
  try {
    return await getCatalog(buyerIP(await headers()));
  } catch (error) {
    const local = localCatalog();
    // Keep verified package information readable; the client checks live availability
    // separately and disables purchasing when Shopify cannot be reached.
    if (local.some(product => product.id === slug)) return local;
    throw error;
  }
}
export async function generateMetadata({
  params
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const {
    slug
  } = await params;
  const products = await catalogForPage(slug);
  const p = products.find(p => p.id === slug) || products.find(p => p.shopifyHandle === slug);
  return {
    title: p ? `${p.name} | FGF Pet Food Bazaar` : 'Product not found'
  };
}
export default async function Page({
  params
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const {
    slug
  } = await params;
  const products = await catalogForPage(slug);
  const product = products.find(p => p.id === slug) || products.find(p => p.shopifyHandle === slug);
  if (!product) notFound();
  return <ProductDetail key={product.id} product={product} related={products.filter(p => p.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group))} />;
}
