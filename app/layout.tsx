import { publicSiteOrigin } from "@/lib/content-public";
import { SiteContentProvider } from "@/components/site-content";
import { getSitePages } from "@/lib/page-content";
import { FavoritesProvider } from "@/components/favorites-provider";
import { CommerceProvider } from "@/components/commerce-provider";
import { LanguageProvider } from "@/components/language-provider";
import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const site = (await getSitePages()).find(page => page.slug === "site")?.content;
  return { metadataBase: new URL(publicSiteOrigin()), title: site?.seoTitle || "FGF Pet Food Bazaar — Happier tails, naturally", description: site?.seoDescription || "Meet happier pet routines, playful brands and natural chews at FGF Pet Food Bazaar." };
}
export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = 'en';
  const pages = await getSitePages();
  return <html lang={language}><body className="fgf-site"><LanguageProvider initialLanguage={language} brand="fgfpetfood"><FavoritesProvider><CommerceProvider brand="fgfpetfood"><SiteContentProvider pages={pages}>{children}</SiteContentProvider></CommerceProvider></FavoritesProvider></LanguageProvider></body></html>;
}
