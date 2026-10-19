import { BoxBuilder } from "@/components/box-builder";
import { HappyTails } from "@/components/happy-tails";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { ProductExplorer } from "@/components/product-explorer";
import { QuizFinder } from "@/components/quiz-finder";
import { JournalSection } from "@/components/journal-section";
import Link from "next/link";

export default function HomePage() {
  return <>
    <SiteHeader />
    <main>
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> A little more joy in every day</p><h1 id="hero-title">Food that makes tails do <em>the happy dance.</em></h1><p className="hero-intro">A playful home for pets, their people and the little moments that make a good day great.</p><div className="hero-buttons"><Link className="button button-dark" href="/shop">Explore the shop <span aria-hidden="true">→</span></Link><a className="text-link" href="#brands">Get to know us <span aria-hidden="true">↗</span></a></div><div className="hero-note"><span className="note-paw" aria-hidden="true">🐾</span><span>Made for sniffing, sharing and happy little rituals.</span></div></div>
        <div className="hero-art"><div className="hero-image-frame"><img src="/assets/stories/bully-stick-story.webp" alt="A cheerful dog beside a natural chew package in the garden" /></div><div className="hero-sticker sticker-sun">WOOF!<br /><small>good days</small></div><div className="hero-scribble">Happy pets<br />live here <span>♡</span></div><span className="floating-star star-one" aria-hidden="true">✳</span><span className="floating-star star-two" aria-hidden="true">✦</span></div>
      </section>
      <section className="promise-ribbon" aria-label="Our promise"><div><span className="promise-icon">✿</span><span><strong>Good ingredients</strong><small>Thoughtful choices</small></span></div><div><span className="promise-icon">🐾</span><span><strong>Pet-first always</strong><small>Made for real life</small></span></div><div><span className="promise-icon">♡</span><span><strong>More happy moments</strong><small>Big and small</small></span></div><div><span className="promise-icon">☀</span><span><strong>A little more play</strong><small>Every single day</small></span></div></section>
      <section id="brands" className="section-wrap brands-section"><div className="section-heading"><div><p className="eyebrow">Meet the family</p><h2>Good things come in <em>good company.</em></h2></div><p>One happy pet community, with a few different ways to make tails wag.</p></div><div className="brand-grid">
        <article className="brand-card brand-card-fgf"><div className="brand-card-copy"><span className="brand-tag">The home base</span><h3>FGF Pet Food Bazaar</h3><p>A friendly place to discover everyday favorites for the pets who make a house feel like home.</p><Link className="button button-light" href="/shop">Explore the bazaar <span aria-hidden="true">→</span></Link></div><img src="/assets/logo-fgf.webp" alt="" className="brand-card-logo" /><span className="brand-doodle" aria-hidden="true">✳</span></article>
        <article className="brand-card brand-card-quipaw"><div className="brand-card-copy"><span className="brand-tag">Dog treats with a tail-wag</span><h3>Quipaw</h3><p>Natural chews and simple treat-time fun, made for curious noses and happy paws.</p><a className="button button-dark" href="https://quipaw.com">Visit Quipaw <span aria-hidden="true">↗</span></a></div><img src="/assets/logo-quipaw.png" alt="" className="brand-card-logo quipaw-logo" /><span className="brand-doodle" aria-hidden="true">♡</span></article>
      </div></section>
      <section id="shop" className="section-wrap shop-section"><div className="section-heading shop-heading"><div><p className="eyebrow">The treat shelf</p><h2>Little favorites for <em>big tail wags.</em></h2></div><div className="shop-heading-action"><p>Have a snack in mind? Search or save a favorite for later.</p><Link className="button button-dark" href="/shop">Browse the full shop <span aria-hidden="true">→</span></Link></div></div><ProductExplorer /></section>
      <BoxBuilder />
      <QuizFinder />
      <JournalSection />
      <section id="community" className="community-section"><div className="section-wrap community-inner"><div className="community-copy"><p className="eyebrow">Good times, together</p><h2>The next big tail wag <em>starts here.</em></h2><p>We’re getting the community calendar ready. Join the pack and we’ll share news when the next meet-up or event is announced.</p><a className="button button-light" href="#newsletter">Keep me in the loop <span aria-hidden="true">→</span></a></div><a className="community-art pdf-community-art" href="#newsletter" aria-label="Get updates about FGF community events"><img src="/assets/fgf-pdf-events.webp" alt="A happy dog at an outdoor activity beneath the words Events and Activities" /></a><div className="community-confetti" aria-hidden="true">✳ ✦ ✿</div></div></section>
      <HappyTails brand="fgf" />
      <Newsletter />
    </main>
    <SiteFooter />
  </>;
}

function Newsletter() {
  return <section id="newsletter" className="newsletter-section section-wrap"><div className="newsletter-card"><div><p className="eyebrow">Letters from the happy place</p><h2>A little good news for <em>your inbox.</em></h2><p>Product news, fresh stories and the occasional very good dog photo.</p></div><form className="newsletter-form" action="mailto:info@fgfpetfoodbazaar.com" method="post" encType="text/plain"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" placeholder="Your email address" required /><button className="button button-dark" type="submit">Count me in <span aria-hidden="true">→</span></button><p className="form-message">Email signup will be connected when the store launches.</p></form></div></section>;
}
