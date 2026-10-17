"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return <>
    <div className="announcement"><span>Better food. Brighter days.</span><span className="announce-paw" aria-hidden="true">✦</span><span>For every happy tail</span></div>
    <header className="site-header" id="top">
      <Link className="brand-lockup" href="/" aria-label="FGF Pet Food Bazaar home"><img src="/assets/logo-fgf.webp" alt="FGF Pet Food Bazaar" /></Link>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="fgf-main-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}><span /><span /></button>
      <nav id="fgf-main-nav" className={"main-nav " + (open ? "is-open" : "")} aria-label="Main navigation">
        <Link href="/#brands" onClick={closeMenu}>Our brands</Link>
        <Link href="/shop" onClick={closeMenu}>Shop</Link>
        <Link href="/#journal" onClick={closeMenu}>Journal</Link>
        <Link href="/#community" onClick={closeMenu}>Community</Link>
        <Link href="/#contact" onClick={closeMenu}>Contact</Link>
      </nav>
      <Link className="button button-dark header-shop" href="/shop">Find a favorite <span aria-hidden="true">→</span></Link>
    </header>
  </>;
}

export function SiteFooter() {
  return <>
    <section id="contact" className="fgf-help-section section-wrap" aria-labelledby="fgf-help-title">
      <div className="fgf-help-visual">
        <img src="/assets/fgf-pdf-contact.webp" alt="We’re here to help: a friendly golden retriever wearing a headset beside an FGF laptop" width="1948" height="908" />
      </div>
      <div className="fgf-help-panel">
        <div className="fgf-help-copy">
          <p className="eyebrow">Real people, happy paws</p>
          <h2 id="fgf-help-title">Questions? We’re <em>all ears.</em></h2>
          <p>Need help finding a favorite or have a question about the Bazaar? Give our team a call or send us a note.</p>
        </div>
        <div className="fgf-help-links">
          <a className="fgf-help-link fgf-help-phone" href="tel:+18325550188"><span>Call the team</span><strong>+1 (832) 555-0188</strong><small>Tap to call us</small></a>
          <a className="fgf-help-link fgf-help-email" href="mailto:info@fgfpetfoodbazaar.com"><span>Send a note</span><strong>info@fgfpetfoodbazaar.com</strong><small>We’d love to hear from you</small></a>
        </div>
      </div>
    </section>
    <footer className="site-footer">
      <div className="footer-main section-wrap">
        <div className="footer-brand"><Link href="/"><img src="/assets/logo-fgf.webp" alt="FGF Pet Food Bazaar" /></Link><p>Better food. Happier pets. More little moments worth keeping.</p><span className="footer-sparkle" aria-hidden="true">✦ ✿ ✦</span></div>
        <div><h3>Take a look</h3><Link href="/#brands">Our brands</Link><Link href="/shop">Shop the Bazaar</Link><Link href="/#journal">Journal</Link><Link href="/#community">Community</Link></div>
        <div className="footer-contact"><h3>Say hello</h3><a href="tel:+18325550188">☎ +1 (832) 555-0188</a><a href="mailto:info@fgfpetfoodbazaar.com">✉ info@fgfpetfoodbazaar.com</a><a href="https://www.fgfpetfood.com/" target="_blank" rel="noreferrer">Current FGF website ↗</a></div>
        <div className="footer-note"><span aria-hidden="true">🐾</span><strong>Good food.<br />Good company.</strong><small>Happier days start here!</small><Link className="footer-note-link" href="/shop">Find a new favorite →</Link></div>
      </div>
      <div className="footer-bottom section-wrap"><span>© FGF Pet Food Bazaar</span><span>Made with a little extra tail-wag.</span><Link href="/#top">Back to top ↑</Link></div>
    </footer>
  </>;
}
