import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const origin = (process.env.SITE_URL || "https://fgfpetfood.vercel.app").replace(/\/$/, "");
  return { rules: { userAgent: "*", allow: ["/", "/api/media/"], disallow: ["/admin", "/account", "/cart", "/api/"] }, sitemap: `${origin}/sitemap.xml` };
}
