export type CMSKind = 'product' | 'article' | 'event' | 'page';
export type CMSMedia = { type: 'image' | 'video'; src: string; alt: string; poster?: string; origin?: 'original' | 'ai' };
export type CMSSection = { heading: string; body: string; media?: CMSMedia };
export type CMSContent = {
  title: string;
  subtitle?: string;
  excerpt: string;
  body: string;
  media: CMSMedia[];
  sections: CMSSection[];
  seoTitle: string;
  seoDescription: string;
  category?: string;
  featured?: boolean;
  /** Product fields describe the website only. Shopify owns price, variants and stock. */
  product?: { ingredients: string; packSize: string; origin: string; highlights: { title: string; body: string }[] };
  event?: { date: string; endDate: string; location: string; registrationUrl: string; status: 'planned' | 'scheduled' | 'cancelled' };
  /** Named editable site sections, e.g. hero or homeEvents. */
  page?: { sections: { key: string; title: string; subtitle: string; body: string; media: CMSMedia[] }[] };
};
export type CMSDocument = {
  id: string; kind: CMSKind; slug: string; draft: CMSContent;
  published: CMSContent | null; revision: number; updatedAt: number;
  publishedAt: number | null;
};
export type CMSPublished = { id: string; kind: CMSKind; slug: string; content: CMSContent; updatedAt: number; publishedAt: number };
export type CMSAudit = { id: string; documentId: string; actorName: string; action: string; revision: number; createdAt: number };
export type CMSInboxMessage = { id: string; name: string; email: string; subject: string; message: string; status: 'unread' | 'read' | 'archived'; createdAt: number };
export type CMSAsset = { id: string; type: 'image' | 'video'; name: string; contentType: string; size: number; src: string; createdAt: number; ready: boolean };
export type CMSSeed = { kind: CMSKind; slug: string; content: CMSContent };
export const emptyCMSContent = (): CMSContent => ({ title: '', excerpt: '', body: '', media: [], sections: [], seoTitle: '', seoDescription: '' });
