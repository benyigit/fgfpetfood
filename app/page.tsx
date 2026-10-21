"use client";

import { useLanguage } from "@/components/language-provider";
import { PackagingHighlights } from "@/components/packaging-highlights";
import { BoxBuilder } from "@/components/box-builder";
import { HappyTails } from "@/components/happy-tails";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { ProductExplorer } from "@/components/product-explorer";
import { QuizFinder } from "@/components/quiz-finder";
import { JournalSection } from "@/components/journal-section";
import Link from "next/link";
export default function HomePage() {
  const {
    t,
    language
  } = useLanguage();
  return <>
    <SiteHeader />
    <main>
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" />{t(" A little more joy in every day")}</p><h1 id="hero-title">{t("Food that makes tails do ")}<em>{t("the happy dance.")}</em></h1><p className="hero-intro">{t("A playful home for pets, their people and the little moments that make a good day great.")}</p><div className="hero-buttons"><Link className="button button-dark" href="/shop">{t("Explore the shop ")}<span aria-hidden="true">→</span></Link><a className="text-link" href="#brands">{t("Get to know us ")}<span aria-hidden="true">↗</span></a></div><div className="hero-note"><span className="note-paw" aria-hidden="true">🐾</span><span>{t("Made for sniffing, sharing and happy little rituals.")}</span></div></div>
        <div className="hero-art"><div className="hero-image-frame"><img src="/assets/stories/fgf-golden-cocker-hero.webp" alt={t("A gentle golden cocker spaniel enjoying a bully stick beside a Quipaw treat pouch in a sunny garden")} /></div><div className="hero-sticker sticker-sun">{t("WOOF!")}<br /><small>{t("good days")}</small></div><div className="hero-scribble">{t("Happy pets")}<br />{t("live here ")}<span>♡</span></div><span className="floating-star star-one" aria-hidden="true">✳</span><span className="floating-star star-two" aria-hidden="true">✦</span></div>
      </section>
      <PackagingHighlights />
      <section id="brands" className="section-wrap brands-section"><div className="section-heading"><div><p className="eyebrow">{t("Meet the family")}</p><h2>{t("Good things come in ")}<em>{t("good company.")}</em></h2></div><p>{t("One happy pet community, with a few different ways to make tails wag.")}</p></div><div className="brand-grid">
        <article className="brand-card brand-card-fgf"><div className="brand-card-copy"><span className="brand-tag">{t("The home base")}</span><h3>{t("FGF Pet Food Bazaar")}</h3><p>{t("A friendly place to discover everyday favorites for the pets who make a house feel like home.")}</p><Link className="button button-light" href="/shop">{t("Explore the bazaar ")}<span aria-hidden="true">→</span></Link></div><img src="/assets/logo-fgf.webp" alt={t("")} className="brand-card-logo" /><span className="brand-doodle" aria-hidden="true">✳</span></article>
        <article className="brand-card brand-card-quipaw"><div className="brand-card-copy"><span className="brand-tag">{t("Dog treats with a tail-wag")}</span><h3>{t("Quipaw")}</h3><p>{t("Natural chews and simple treat-time fun, made for curious noses and happy paws.")}</p><a className="button button-dark" href="https://quipaw.com">{t("Visit Quipaw ")}<span aria-hidden="true">↗</span></a></div><img src="/assets/logo-quipaw.png" alt={t("")} className="brand-card-logo quipaw-logo" /><span className="brand-doodle" aria-hidden="true">♡</span></article>
      </div></section>
      <section id="shop" className="section-wrap shop-section"><div className="section-heading shop-heading"><div><p className="eyebrow">{t("The treat shelf")}</p><h2>{t("Little favorites for ")}<em>{t("big tail wags.")}</em></h2></div><div className="shop-heading-action"><p>{t("Have a snack in mind? Search or save a favorite for later.")}</p><Link className="button button-dark" href="/shop">{t("Browse the full shop ")}<span aria-hidden="true">→</span></Link></div></div><ProductExplorer /></section>
      <BoxBuilder />
      <QuizFinder />
      <JournalSection />
      <section id="community" className="community-section"><div className="section-wrap community-inner"><div className="community-copy"><p className="eyebrow">{t("Good times, together")}</p><h2>{t("The next big tail wag ")}<em>{t("starts here.")}</em></h2><p>{t("We’re getting the community calendar ready. Join the pack and we’ll share news when the next meet-up or event is announced.")}</p><Link className="button button-light" href="/events">{t("Explore event ideas ")}<span aria-hidden="true">→</span></Link></div><Link className="community-art pdf-community-art" href="/events" aria-label={t("Get updates about FGF community events")}><img src="/assets/fgf-pdf-events.webp" alt={t("A happy dog at an outdoor activity beneath the words Events and Activities")} /></Link><div className="community-confetti" aria-hidden="true">✳ ✦ ✿</div></div></section>
      <HappyTails brand="fgf" />
      <Newsletter />
    </main>
    <SiteFooter />
  </>;
}
function Newsletter() {
  const {
    t,
    language
  } = useLanguage();
  return <section id="newsletter" className="newsletter-section section-wrap"><div className="newsletter-card"><div><p className="eyebrow">{t("Letters from the happy place")}</p><h2>{t("A little good news for ")}<em>{t("your inbox.")}</em></h2><p>{t("Product news, fresh stories and the occasional very good dog photo.")}</p></div><form className="newsletter-form" action="mailto:info@fgfpetfoodbazaar.com" method="post" encType="text/plain"><label className="sr-only" htmlFor="newsletter-email">{t("Email address")}</label><input id="newsletter-email" name="email" type="email" placeholder={t("Your email address")} required /><button className="button button-dark" type="submit">{t("Count me in ")}<span aria-hidden="true">→</span></button><p className="form-message">{t("Email signup will be connected when the store launches.")}</p></form></div></section>;
}
