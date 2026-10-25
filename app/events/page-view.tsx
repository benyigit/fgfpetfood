'use client';

import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { PageTrail } from '@/components/page-trail';
import { ContentMedia } from '@/components/content-media';
import type { CMSPublished } from '@/lib/cms-types';
import styles from '@/components/events.module.css';

function eventDate(value: string) {
  if (!value) return '';
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}
export default function EventsPage({ events }: { events: CMSPublished[] }) {
  const confirmed = events.some(event => event.content.event?.status === 'scheduled' && event.content.event.date);
  return <><SiteHeader current="events" /><main className={styles.page}>
    <PageTrail page="events" />
    <div className={`${styles.banner} section-wrap`}><img src="/assets/fgf-pdf-events.webp" alt="FGF Events and Activities with dogs playing in a sunny field" /></div>
    <section className={`${styles.intro} section-wrap`}><div><p className="eyebrow">Good days with FGF</p><h1>Good company.<br /><em>Happier tails.</em></h1><p>Little reasons to get together. Good moments to remember. Explore the latest from our community.</p></div><aside className={styles.note}><span aria-hidden="true">✳</span><strong>{confirmed ? 'Your next good day starts here' : 'Good things are in the making'}</strong><p>{confirmed ? 'Find the date, location and latest information on each event below.' : 'These are ideas for future get-togethers. Confirmed dates and locations will appear here when they are ready.'}</p></aside></section>
    <section id="event-ideas" className={`${styles.ideas} section-wrap`} aria-labelledby="event-ideas-title"><div className={styles.heading}><div><p className="eyebrow">A little something to look forward to</p><h2 id="event-ideas-title">What sounds like <em>your kind of day?</em></h2></div><p>Good moments for dogs and the people who love them.</p></div>
      <div className={styles.grid}>{events.map(document => {
        const event = document.content;
        const details = event.event;
        return <article key={document.id} className={styles.card} id={document.slug}>
          {event.media[0] && <ContentMedia media={event.media[0]} className={styles.cardMedia} />}
          <div><span className={styles.category}>{event.category || 'Community day'}</span><h3><Link href={`/events/${document.slug}`}>{event.title}</Link></h3>{event.subtitle && <p className={styles.cardSubtitle}>{event.subtitle}</p>}
            <span className={styles.eventStatus} data-status={details?.status || 'planned'}>{details?.status === 'cancelled' ? 'Cancelled' : details?.status === 'scheduled' ? 'On the calendar' : 'An idea for a good day'}</span>
            {(details?.date || details?.location) && <dl className={styles.eventFacts}>{details.date && <><dt>When</dt><dd><time dateTime={details.date}>{eventDate(details.date)}</time>{details.endDate && details.endDate.slice(0, 10) !== details.date.slice(0, 10) && <> – <time dateTime={details.endDate}>{eventDate(details.endDate)}</time></>}</dd></>}{details.location && <><dt>Where</dt><dd>{details.location}</dd></>}</dl>}
            <p>{event.excerpt}</p>
            <Link href={`/events/${document.slug}`} className={styles.detailsLink}>Explore this day <span aria-hidden="true">→</span></Link>
            {details?.status !== 'cancelled' && (details?.registrationUrl ? <a href={details.registrationUrl} target="_blank" rel="noopener noreferrer">Event details & registration <span aria-hidden="true">↗</span></a> : <Link href={`/#contact`}>Ask us about this day <span aria-hidden="true">→</span></Link>)}
          </div>
        </article>;
      })}</div>
      {!events.length && <p className={styles.empty}>There are no event announcements right now. Check back for the next good day together.</p>}
    </section>
    <aside className={`${styles.callout} section-wrap`}><div><p className="eyebrow">Your idea could start a good day</p><h2>Have a little idea of your own?</h2><p>We’d love to hear what you and your dog would enjoy.</p></div><Link className="button button-dark" href="/#contact">Share an idea ↗</Link></aside>
    <div className={`${styles.more} section-wrap`}><Link href="/blog">Find a little inspiration on the blog →</Link><Link href="/#newsletter">Community updates →</Link></div>
    <PageTrail page="events" bottom />
  </main><SiteFooter /></>;
}
