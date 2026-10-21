"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";
import { MemberTools } from "./member-tools";
import { useState } from "react";
import { ContactForm } from "./contact-form";
export function SiteHeader({
  current = "home"
}: {
  current?: "home" | "shop" | "blog" | "events";
}) {
  const {
    t,
    language
  } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  return <>
    <div className="announcement"><span>{t("Better food. Brighter days.")}</span><span className="announce-paw" aria-hidden="true">✦</span><span>{t("For every happy tail")}</span></div>
    <header className="site-header" id="top">
      <Link className="brand-lockup" href="/" aria-label={t("FGF Pet Food Bazaar home")}><img src="/assets/logo-fgf.webp" alt={t("FGF Pet Food Bazaar")} /></Link>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="fgf-main-nav" aria-label={t(open ? "Close menu" : "Open menu")} onClick={() => setOpen(value => !value)}><span /><span /></button>
      <nav id="fgf-main-nav" className={"main-nav " + (open ? "is-open" : "")} aria-label={t("Main navigation")}>
        <Link href="/#brands" onClick={closeMenu}>{t("Our brands")}</Link>
        <Link href="/shop" onClick={closeMenu} aria-current={current === "shop" ? "page" : undefined}>{t("Shop")}</Link>
        <Link href="/blog" onClick={closeMenu} aria-current={current === "blog" ? "page" : undefined}>{t("Blog")}</Link>
        <Link href="/events" onClick={closeMenu} aria-current={current === "events" ? "page" : undefined}>{t("Events")}</Link>
        <Link href="/#contact" onClick={closeMenu}>{t("Contact")}</Link>
      </nav>
      <MemberTools /><Link className="button button-dark header-shop" href="/shop">{t("Find a favorite ")}<span aria-hidden="true">→</span></Link>
    </header>
  </>;
}
export function SiteFooter() {
  const {
    t,
    language
  } = useLanguage();
  return <>
    <section id="contact" className="fgf-help-section section-wrap" aria-labelledby="fgf-help-title">
      <div className="fgf-help-visual">
        <img src="/assets/fgf-pdf-contact.webp" alt={t("We’re here to help: a friendly golden retriever wearing a headset beside an FGF laptop")} width="1948" height="908" />
      </div>
      <div className="fgf-help-panel">
        <div className="fgf-help-copy">
          <p className="eyebrow">{t("Real people, happy paws")}</p>
          <h2 id="fgf-help-title">{t("Questions? We’re ")}<em>{t("all ears.")}</em></h2>
          <p>{t("Need help finding a favorite or have a question about the Bazaar? Give our team a call or send us a note.")}</p>
        <div className="fgf-help-links">
          <a className="fgf-help-link fgf-help-phone" href="tel:+12813010010"><span>{t("Call the team")}</span><strong>281-301-0010</strong><small>{t("Tap to call us")}</small></a>
          <a className="fgf-help-link fgf-help-email" href="mailto:info@fgfpetfoodbazaar.com"><span>{t("Send a note")}</span><strong>{t("info@fgfpetfoodbazaar.com")}</strong><small>{t("We’d love to hear from you")}</small></a>
        </div>
        </div>
        <ContactForm />
      </div>
    </section>
    <footer className="site-footer">
      <div className="footer-main section-wrap">
        <div className="footer-brand"><Link href="/"><img src="/assets/logo-fgf.webp" alt={t("FGF Pet Food Bazaar")} /></Link><p>{t("Better food. Happier pets. More little moments worth keeping.")}</p><span className="footer-sparkle" aria-hidden="true">✦ ✿ ✦</span></div>
        <div><h3>{t("Take a look")}</h3><Link href="/#brands">{t("Our brands")}</Link><Link href="/shop">{t("Shop the Bazaar")}</Link><Link href="/#happy-box">{t("Build a happy box")}</Link><Link href="/#happy-tails">{t("Happy tails scrapbook")}</Link><Link href="/blog">{t("Blog")}</Link><Link href="/events">{t("Events")}</Link></div>
        <div className="footer-contact"><h3>{t("Say hello")}</h3><a href="tel:+12813010010">☎ 281-301-0010</a><a href="mailto:info@fgfpetfoodbazaar.com">{t("✉ info@fgfpetfoodbazaar.com")}</a><a href="https://www.fgfpetfood.com/" target="_blank" rel="noreferrer">{t("Current FGF website ↗")}</a></div>
        <div className="footer-note"><span aria-hidden="true">🐾</span><strong>{t("Good food.")}<br />{t("Good company.")}</strong><small>{t("Happier days start here!")}</small><Link className="footer-note-link" href="/shop">{t("Find a new favorite →")}</Link></div>
      </div>
      <div className="footer-community section-wrap"><Link href="/account">{"My account & photos ↗"}</Link><Link href="/cart">{"My treat bag ↗"}</Link></div>
    <div className="footer-trademark section-wrap">QUIPAW is Registered trademark of FGF PET FOOD BAZAAR LLC</div>
    <div className="footer-bottom section-wrap"><span>{t("© FGF Pet Food Bazaar")}</span><span>{t("Made with a little extra tail-wag.")}</span><Link href="/#top">{t("Back to top ↑")}</Link></div>
    </footer>
  </>;
}
