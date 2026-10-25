import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicEvent, publicSiteOrigin } from '@/lib/content-public';
import { EventDetail } from '@/components/event-detail';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const document = await getPublicEvent((await params).slug);
  if (!document) return { title: 'Event not found — FGF Pet Food Bazaar', robots: { index: false, follow: false } };
  const event = document.content;
  const title = event.seoTitle || event.title;
  const description = event.seoDescription || event.excerpt;
  const url = `${publicSiteOrigin()}/events/${encodeURIComponent(document.slug)}`;
  const image = event.media.find(media => media.type === 'image')?.src || event.media.find(media => media.poster)?.poster;
  const images = image ? [{ url: new URL(image, publicSiteOrigin()).href, alt: event.title }] : undefined;
  return { title: `${title} — FGF Pet Food Bazaar Events`, description, alternates: { canonical: url },
    openGraph: { title, description, url, images, type: 'website' },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map(image => image.url) },
  };
}
export default async function EventPage({ params }: Props) {
  const document = await getPublicEvent((await params).slug);
  if (!document) notFound();
  const event = document.content;
  const facts = event.event;
  const url = `${publicSiteOrigin()}/events/${encodeURIComponent(document.slug)}`;
  const hasDate = facts?.date && !Number.isNaN(Date.parse(facts.date));
  const schema = facts?.status === 'scheduled' && hasDate && facts.location ? {
    '@context': 'https://schema.org', '@type': 'Event', name: event.title, description: event.excerpt, url,
    startDate: facts.date, ...(facts.endDate && !Number.isNaN(Date.parse(facts.endDate)) ? { endDate: facts.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'Place', name: facts.location },
    ...(event.media.some(media => media.type === 'image') ? { image: event.media.filter(media => media.type === 'image').map(media => new URL(media.src, publicSiteOrigin()).href) } : {}),
    organizer: { '@type': 'Organization', name: 'FGF Pet Food Bazaar', url: publicSiteOrigin() },
  } : null;
  return <>{schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}<EventDetail event={event} /></>;
}
