'use client';
import Link from 'next/link';
import type { CMSContent } from '@/lib/cms-types';
import { SiteHeader, SiteFooter } from './site-shell';
import { ContentMedia } from './content-media';
import styles from './events.module.css';

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
export function EventDetail({ event }: { event: CMSContent }) {
  const facts = event.event;
  return <><SiteHeader current="events" /><main className={styles.detailPage}>
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
