'use client';

import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { PageTrail } from '@/components/page-trail';
import { useLanguage } from '@/components/language-provider';
import styles from '@/components/events.module.css';
const ideas = [{
  title: ['Park play day'],
  category: ['Meet & play'],
  image: 'park-play.webp',
  description: ['An easy-going day for a little walk, a good sniff and a few new friends.']
}, {
  title: ['Grooming & care'],
  category: ['Learn together'],
  image: 'grooming.webp',
  description: ['A chance to exchange everyday care ideas and learn something new together.']
}, {
  title: ['Training & agility'],
  category: ['Try something new'],
  image: 'training.webp',
  description: ['Playful activities for curious dogs and the humans cheering them on.']
}, {
  title: ['Photo day & picnic'],
  category: ['Make a little memory'],
  image: 'photo-picnic.webp',
  description: ['A little sunshine, a favourite companion and a moment worth keeping.']
}];
export default function EventsPage() {
  const {
    language
  } = useLanguage();
  const index = 0;
  return <><SiteHeader current="events" /><main className={styles.page}>
    <PageTrail page="events" />
    <div className={`${styles.banner} section-wrap`}><img src="/assets/fgf-pdf-events.webp" alt={'A happy dog outdoors on the FGF Events and Activities banner'} /></div>
    <section className={`${styles.intro} section-wrap`}><div><p className="eyebrow">{'Good days with FGF'}</p><h1>{'Good company.'}<br /><em>{'Happier tails.'}</em></h1><p>{'Little reasons to get together. Good moments to remember. Take a look at the days we’re dreaming up for our community.'}</p></div><aside className={styles.note}><span aria-hidden="true">✳</span><strong>{'Good things are in the making'}</strong><p>{'No dates or locations are confirmed yet. These are event ideas we’re exploring; we’ll share the details here when they’re ready.'}</p></aside></section>
    <section id="event-ideas" className={`${styles.ideas} section-wrap`} aria-labelledby="event-ideas-title"><div className={styles.heading}><div><p className="eyebrow">{'A little something to look forward to'}</p><h2 id="event-ideas-title">{'What sounds like'} <em>{'your kind of day?'}</em></h2></div><p>{'Choose an idea to open a note to the FGF team.'}</p></div><div className={styles.grid}>{ideas.map(idea => <article key={idea.image} className={styles.card}><img src={`/assets/events/${idea.image}`} alt={idea.title[index]} loading="lazy" /><div><span className={styles.category}>{idea.category[index]}</span><h3>{idea.title[index]}</h3><p>{idea.description[index]}</p><a href={`mailto:info@fgfpetfoodbazaar.com?subject=${encodeURIComponent(`FGF event idea: ${idea.title[0]}`)}`}>{'I’d love a day like this'} <span aria-hidden="true">↗</span></a></div></article>)}</div></section>
    <aside className={`${styles.callout} section-wrap`}><div><p className="eyebrow">{'Your idea could start a good day'}</p><h2>{'Have a little idea of your own?'}</h2><p>{'We’d love to hear what you and your dog would enjoy.'}</p></div><a className="button button-dark" href="mailto:info@fgfpetfoodbazaar.com?subject=An%20event%20idea%20for%20FGF">{'Share an idea'} ↗</a></aside>
    <div className={`${styles.more} section-wrap`}><Link href="/blog">{'Find a little inspiration on the blog →'}</Link><Link href="/#newsletter">{'Community updates →'}</Link></div>
    <PageTrail page="events" bottom />
  </main><SiteFooter /></>;
}
