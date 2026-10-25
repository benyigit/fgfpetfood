"use client";
import { createContext, useContext } from "react";
import type { CMSPublished, CMSMedia } from "@/lib/cms-types";
const SiteContent = createContext<CMSPublished[]>([]);
export function SiteContentProvider({ pages, children }: { pages: CMSPublished[]; children: React.ReactNode }) { return <SiteContent.Provider value={pages}>{children}</SiteContent.Provider>; }
export function usePageSection(page: string, key: string) { return useContext(SiteContent).find(doc => doc.slug === page)?.content.page?.sections.find(section => section.key === key); }
export function SiteMedia({ media, className, priority = false }: { media?: CMSMedia; className?: string; priority?: boolean }) {
  if (!media) return null;
  return media.type === "video" ? <video className={className} src={media.src} poster={media.poster} controls playsInline preload="metadata" aria-label={media.alt || "Video"} style={{ display: "block", width: "100%", maxWidth: "100%", objectFit: "cover" }} /> : <img className={className} src={media.src} alt={media.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />;
}
