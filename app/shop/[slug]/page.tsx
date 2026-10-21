import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/shopify";
import { ProductDetail } from "@/components/product-detail";
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
  const p = (await getCatalog()).find(p => p.id === slug);
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
  const products = await getCatalog();
  const product = products.find(p => p.id === slug);
  if (!product) notFound();
  return <ProductDetail key={product.id} product={product} related={products.filter(p => p.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group))} />;
}
