import { FavoritesProvider } from "@/components/favorites-provider";
import { CommerceProvider } from "@/components/commerce-provider";
import { LanguageProvider } from "@/components/language-provider";
import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
export const metadata: Metadata = {
  title: "FGF Pet Food Bazaar — Happier tails, naturally",
  description: "Meet happier pet routines, playful brands and natural chews at FGF Pet Food Bazaar."
};
export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = 'en';
  return <html lang={language}><body className="fgf-site"><LanguageProvider initialLanguage={language} brand="fgfpetfood"><FavoritesProvider><CommerceProvider brand="fgfpetfood">{children}</CommerceProvider></FavoritesProvider></LanguageProvider></body></html>;
}
