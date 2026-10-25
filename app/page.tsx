import type { Metadata } from "next";
import { getSitePages } from "@/lib/page-content";
import HomePageView from "./page-view";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const home = (await getSitePages()).find(page => page.slug === "home")?.content;
  return { title: home?.seoTitle || undefined, description: home?.seoDescription || undefined, alternates: { canonical: "/" }, openGraph: { title: home?.seoTitle || undefined, description: home?.seoDescription || undefined, url: "/", type: "website" } };
}
export default function HomePage() { return <HomePageView />; }
