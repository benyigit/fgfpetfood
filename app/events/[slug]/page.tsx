import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { ContentMedia } from '@/components/content-media';
import { getPublicEvent, publicSiteOrigin } from '@/lib/content-public';
import styles from '@/components/events.module.css';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
const paragraphs = (text: string) => text.split(/\n\s*\n/).filter(Boolean);
function displayDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}
function dateTime(value: string) {
  return <><time dateTime={value}>{displayDate(value)}</time>{value.includes('T') && <span> · {value.slice(11, 16)}{/[Z+-]/.test(value.slice(16)) ? ` ${value.slice(16).replace(/^:00/, '')}` : ''}</span>}</>;
}
function Back({ title }: { title: string }) {
  return <nav className={`${styles.detailTrail} section-wrap`} aria-label="Event navigation"><Link href="/events#event-ideas">← Back to events</Link><span><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/events">Events</Link><span aria-hidden="true"> / </span><span aria-current="page">{title}</span></span></nav>;
}
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
  return <><SiteHeader current="events" /><main className={styles.detailPage}>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}
    <Back title={event.title} />
    <header className={`${styles.detailHeader} section-wrap`}><p className="eyebrow">{event.category || 'A day with our community'}</p><h1>{event.title}</h1>{event.subtitle && <p className={styles.detailSubtitle}>{event.subtitle}</p>}{event.excerpt && <p>{event.excerpt}</p>}<span className={styles.eventStatus} data-status={facts?.status || 'planned'}>{facts?.status === 'cancelled' ? 'This event has been cancelled' : facts?.status === 'scheduled' ? 'On the calendar' : 'An idea for a future get-together'}</span></header>
    {event.media[0] && <figure className={`${styles.detailCover} section-wrap`}><ContentMedia media={event.media[0]} priority />{event.media[0].origin === 'ai' && <figcaption>An AI-created lifestyle scene.</figcaption>}</figure>}
    <div className={`${styles.detailLayout} section-wrap`}>
      <article className={styles.detailBody} aria-label={event.title}>
        {event.body !== event.excerpt && paragraphs(event.body).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {event.sections.map((section, index) => <section key={index}>{section.heading && <h2>{section.heading}</h2>}{paragraphs(section.body).map((paragraph, i) => <p key={i}>{paragraph}</p>)}{section.media && <figure><ContentMedia media={section.media} />{section.media.origin === 'ai' && <figcaption>An AI-created lifestyle scene.</figcaption>}</figure>}</section>)}
        {event.media.slice(1).map((media, index) => <figure key={`${media.src}-${index}`}><ContentMedia media={media} />{media.origin === 'ai' && <figcaption>An AI-created lifestyle scene.</figcaption>}</figure>)}
      </article>
      <aside className={styles.detailAside}><h2>The little details</h2><dl className={styles.eventFacts}><dt>When</dt><dd>{facts?.date ? dateTime(facts.date) : 'Date to be announced'}{facts?.endDate && <><br /><span>Until </span>{dateTime(facts.endDate)}</>}</dd><dt>Where</dt><dd>{facts?.location || 'Location to be announced'}</dd></dl>{facts?.status !== 'cancelled' && (facts?.registrationUrl ? <a className="button button-dark" href={facts.registrationUrl} target="_blank" rel="noopener noreferrer">Details & registration ↗</a> : <Link className="button button-dark" href="/#contact">Ask about this day →</Link>)}</aside>
    </div>
    <Back title={event.title} />
  </main><SiteFooter /></>;
}
