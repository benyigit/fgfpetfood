import type { MetadataRoute } from "next";
import { getPublicArticles, getPublicEvents, publicSiteOrigin } from "@/lib/content-public";
import { getCatalog } from "@/lib/shopify";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteOrigin();
  const [articles, products, events] = await Promise.all([getPublicArticles(), getCatalog(), getPublicEvents()]);
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    ...["shop", "blog", "events"].map(path => ({ url: `${origin}/${path}`, changeFrequency: "weekly" as const, priority: .8 })),
    ...articles.map(article => ({ url: `${origin}/blog/${article.id}`, changeFrequency: "monthly" as const, priority: .6 })),
    ...events.map(event => ({ url: `${origin}/events/${event.slug}`, changeFrequency: "weekly" as const, priority: .6 })),
    ...products.map(product => ({ url: `${origin}/shop/${product.id}`, changeFrequency: "weekly" as const, priority: .7 }))
  ];
}
