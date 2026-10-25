'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CMSContent, CMSMedia, CMSPublished } from '@/lib/cms-types';
import { articleFromPublished, type BlogArticle } from '@/lib/blog';
import { localCatalog, type CatalogProduct } from '@/lib/catalog';
import { applyProductEditorial } from '@/lib/product-content';
import type { PreviewDraft } from './admin-preview';
import { BlogReader } from './blog-reader';
import { ProductDetail } from './product-detail';
import { EventDetail } from './event-detail';
import { SiteContentProvider } from './site-content';
import HomePage from '@/app/page-view';

const text = (value: unknown): value is string => typeof value === 'string';
function isMedia(value: unknown): value is CMSMedia {
  if (!value || typeof value !== 'object') return false;
  const media = value as CMSMedia;
  return (media.type === 'image' || media.type === 'video') && text(media.src) && text(media.alt) && (media.poster === undefined || text(media.poster));
}
function isContent(value: unknown): value is CMSContent {
  if (!value || typeof value !== 'object') return false;
  const content = value as CMSContent;
  return text(content.title) && text(content.excerpt) && text(content.body) && text(content.seoTitle) && text(content.seoDescription)
    && Array.isArray(content.media) && content.media.length <= 30 && content.media.every(isMedia)
    && Array.isArray(content.sections) && content.sections.length <= 100 && content.sections.every(section => section && text(section.heading) && text(section.body) && (!section.media || isMedia(section.media)))
    && (!content.product || (text(content.product.ingredients) && text(content.product.packSize) && text(content.product.origin) && Array.isArray(content.product.highlights) && content.product.highlights.every(item => text(item.title) && text(item.body))))
    && (!content.event || (text(content.event.date) && text(content.event.endDate) && text(content.event.location) && text(content.event.registrationUrl) && ['planned', 'scheduled', 'cancelled'].includes(content.event.status)))
    && (!content.page || (Array.isArray(content.page.sections) && content.page.sections.every(section => section && text(section.key) && text(section.title) && text(section.subtitle) && text(section.body) && Array.isArray(section.media) && section.media.every(isMedia))));
}
function isDraft(value: unknown): value is PreviewDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as PreviewDraft;
  return ['product', 'article', 'event', 'page'].includes(draft.kind) && text(draft.slug) && draft.slug.length <= 100 && isContent(draft.content);
}
function publishedShape(draft: PreviewDraft): CMSPublished {
  return { id: draft.id || 'private-preview', kind: draft.kind, slug: draft.slug || 'your-new-page', content: draft.content, updatedAt: 0, publishedAt: 0 };
}

export function AdminPreviewUnavailable({ channel }: { channel: string }) {
  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: 'brand-preview-error', channel, message: 'Sign in with an approved administrator account, then refresh this preview.' }, window.location.origin);
  }, [channel]);
  return <main style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', padding: 32, textAlign: 'center', background: '#fbfcf6', color: '#15394a' }}><h1>Private website preview</h1><p>An approved administrator account is required.</p></main>;
}

export function AdminPreviewRuntime({ channel, products, articles, pages }: { channel: string; products: CatalogProduct[]; articles: BlogArticle[]; pages: CMSPublished[] }) {
  const [state, setState] = useState<{ draft: PreviewDraft; sequence: number } | null>(null);
  const lastSequence = useRef(0);
  const firstPage = useRef('');
  useEffect(() => {
    if (window.parent === window) return;
    const send = (type: string, extra: Record<string, unknown> = {}) => window.parent.postMessage({ type, channel, ...extra }, window.location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.channel !== channel || event.data?.type !== 'brand-preview-update') return;
      const sequence = event.data.sequence;
      if (!Number.isSafeInteger(sequence) || sequence <= lastSequence.current || !isDraft(event.data.draft)) return;
      lastSequence.current = sequence;
      setState({ draft: event.data.draft, sequence });
    };
    // Keep visitors' actual actions out of the editorial preview while allowing galleries,
    // accordions, video controls and in-page navigation to behave like the public site.
    const blockSubmit = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation(); send('brand-preview-notice'); };
    const keepPreview = (event: MouseEvent) => {
      const anchor = (event.target instanceof Element ? event.target : null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('#')) return;
      if (href.startsWith('/#') && window.document.getElementById(href.slice(2))) {
        event.preventDefault(); event.stopImmediatePropagation(); window.document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' }); return;
      }
      event.preventDefault(); event.stopImmediatePropagation(); send('brand-preview-notice');
    };
    window.addEventListener('message', receive);
    window.addEventListener('submit', blockSubmit, true);
    window.addEventListener('click', keepPreview, true);
    send('brand-preview-ready');
    return () => { window.removeEventListener('message', receive); window.removeEventListener('submit', blockSubmit, true); window.removeEventListener('click', keepPreview, true); };
  }, [channel]);
  useEffect(() => {
    if (!state) return;
    document.title = `${state.draft.content.seoTitle || state.draft.content.title || 'Untitled'} · Private preview`;
    window.parent.postMessage({ type: 'brand-preview-applied', channel, sequence: state.sequence }, window.location.origin);
    const location = `${state.draft.kind}:${state.draft.slug}`;
    if (firstPage.current !== location) {
      firstPage.current = location;
      requestAnimationFrame(() => {
        if (state.draft.kind === 'page' && state.draft.slug === 'site') document.querySelector('footer')?.scrollIntoView();
        else window.scrollTo({ top: 0 });
      });
    }
  }, [state, channel]);
  const view = useMemo(() => {
    if (!state) return null;
    const draft = state.draft;
    if (draft.kind === 'article') {
      const article = articleFromPublished(publishedShape(draft));
      const others = articles.filter(item => item.id !== draft.slug);
      const related = [...others.filter(item => item.category === article.category), ...others.filter(item => item.category !== article.category)].slice(0, 3);
      const product = products.find(item => item.id === article.productId);
      return <BlogReader preview article={{ en: article }} related={{ en: related }} product={product ? { id: product.id, name: product.name, image: product.media[0]?.src || product.image } : undefined}/>;
    }
    if (draft.kind === 'event') return <EventDetail event={draft.content}/>;
    if (draft.kind === 'product') {
      const base = products.find(item => item.id === draft.slug || item.shopifyHandle === draft.slug) || localCatalog().find(item => item.id === draft.slug) || { id: draft.slug, name: draft.content.title, kind: draft.content.category || '', group: '', image: '', description: '', media: [], variants: [], connected: false };
      const product = applyProductEditorial(base, draft.content);
      return <ProductDetail preview product={product} related={products.filter(item => item.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group))}/>;
    }
    return <HomePage/>;
  }, [state, products, articles]);
  const previewPages = useMemo(() => state?.draft.kind === 'page' ? [...pages.filter(page => page.slug !== state.draft.slug), publishedShape(state.draft)] : pages, [pages, state]);
  return <div data-preview-ready="true"><SiteContentProvider pages={previewPages}>{view || <main style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', color: '#15394a', background: '#fbfcf6', padding: 40, textAlign: 'center' }}><span style={{ fontSize: 42 }}>✿</span><h1 style={{ fontSize: 24 }}>Your website preview is ready.</h1><p>Make a little change and watch it appear here.</p></main>}</SiteContentProvider></div>;
}
