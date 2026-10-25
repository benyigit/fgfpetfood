"use client";

import { usePageSection, SiteMedia } from "@/components/site-content";
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
  const hero = usePageSection("home", "hero");
  const events = usePageSection("home", "homeEvents");
  const shop = usePageSection("home", "shop");
  const brands = usePageSection("home", "brands");
  const {
    t,
    language
  } = useLanguage();
  return <>
    <SiteHeader />
    <main>
      {hero && <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" />{t(" A little more joy in every day")}</p><h1 id="hero-title">{t(hero?.title || "")}{" "}<em>{t(hero?.subtitle || "")}</em></h1><p className="hero-intro">{t(hero?.body || "")}</p><div className="hero-buttons"><Link className="button button-dark" href="/shop">{t("Explore the shop ")}<span aria-hidden="true">→</span></Link><a className="text-link" href="#brands">{t("Get to know us ")}<span aria-hidden="true">↗</span></a></div><div className="hero-note"><span className="note-paw" aria-hidden="true">🐾</span><span>{t("Made for sniffing, sharing and happy little rituals.")}</span></div></div>
        <div className="hero-art"><div className="hero-image-frame"><SiteMedia media={hero?.media[0]} priority /></div><div className="hero-sticker sticker-sun">{t("WOOF!")}<br /><small>{t("good days")}</small></div><div className="hero-scribble">{t("Happy pets")}<br />{t("live here ")}<span>♡</span></div><span className="floating-star star-one" aria-hidden="true">✳</span><span className="floating-star star-two" aria-hidden="true">✦</span></div>
      </section>}
      <PackagingHighlights />
      <section id="brands" className="section-wrap brands-section"><div className="section-heading"><div><p className="eyebrow">{t("Meet the family")}</p><h2>{t(brands?.title || "")}{" "}<em>{t(brands?.subtitle || "")}</em></h2></div><p>{t(brands?.body || "")}</p></div>{brands?.media[0] && <div className="cms-section-visual"><SiteMedia media={brands.media[0]} /></div>}<div className="brand-grid">
        <article className="brand-card brand-card-fgf"><div className="brand-card-copy"><span className="brand-tag">{t("The home base")}</span><h3>{t("FGF Pet Food Bazaar")}</h3><p>{t("A friendly place to discover everyday favorites for the pets who make a house feel like home.")}</p><Link className="button button-light" href="/shop">{t("Explore the bazaar ")}<span aria-hidden="true">→</span></Link></div><img src="/assets/logo-fgf.webp" alt={t("")} className="brand-card-logo" /><span className="brand-doodle" aria-hidden="true">✳</span></article>
        <article className="brand-card brand-card-quipaw"><div className="brand-card-copy"><span className="brand-tag">{t("Dog treats with a tail-wag")}</span><h3>{t("Quipaw")}</h3><p>{t("Natural chews and simple treat-time fun, made for curious noses and happy paws.")}</p><a className="button button-dark" href="https://quipaw.com">{t("Visit Quipaw ")}<span aria-hidden="true">↗</span></a></div><img src="/assets/logo-quipaw.png" alt={t("")} className="brand-card-logo quipaw-logo" /><span className="brand-doodle" aria-hidden="true">♡</span></article>
      </div></section>
      <section id="shop" className="section-wrap shop-section"><div className="section-heading shop-heading"><div><p className="eyebrow">{t("The treat shelf")}</p><h2>{t(shop?.title || "")}{" "}<em>{t(shop?.subtitle || "")}</em></h2></div><div className="shop-heading-action"><p>{t(shop?.body || "")}</p><Link className="button button-dark" href="/shop">{t("Browse the full shop ")}<span aria-hidden="true">→</span></Link></div></div>{shop?.media[0] && <div className="cms-section-visual"><SiteMedia media={shop.media[0]} /></div>}<ProductExplorer /></section>
      <BoxBuilder />
      <QuizFinder />
      <JournalSection />
      {events && <section id="community" className="community-section"><div className="section-wrap community-inner"><div className="community-copy"><p className="eyebrow">{t("Good times, together")}</p><h2>{t(events?.title || "")}{" "}<em>{t(events?.subtitle || "")}</em></h2><p>{t(events?.body || "")}</p><Link className="button button-light" href="/events">{t("Explore event ideas ")}<span aria-hidden="true">→</span></Link></div><div className="community-art pdf-community-art"><SiteMedia media={events?.media[0]} /></div><div className="community-confetti" aria-hidden="true">✳ ✦ ✿</div></div></section>}
      <HappyTails brand="fgf" />
      <Newsletter />
    </main>
    <SiteFooter />
  </>;
}
function Newsletter() {
  const newsletter = usePageSection("home", "newsletter");
  const {
    t,
    language
  } = useLanguage();
  return <section id="newsletter" className="newsletter-section section-wrap"><div className="newsletter-card"><div><p className="eyebrow">{t("Letters from the happy place")}</p><h2>{t(newsletter?.title || "")}{" "}<em>{t(newsletter?.subtitle || "")}</em></h2><p>{t(newsletter?.body || "")}</p></div>{newsletter?.media[0] && <div className="cms-newsletter-visual"><SiteMedia media={newsletter.media[0]} /></div>}<form className="newsletter-form" action="mailto:info@fgfpetfoodbazaar.com" method="post" encType="text/plain"><label className="sr-only" htmlFor="newsletter-email">{t("Email address")}</label><input id="newsletter-email" name="email" type="email" placeholder={t("Your email address")} required /><button className="button button-dark" type="submit">{t("Count me in ")}<span aria-hidden="true">→</span></button><p className="form-message">{t("Email signup will be connected when the store launches.")}</p></form></div></section>;
}
