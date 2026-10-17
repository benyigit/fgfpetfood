"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="announcement"><span>Better food. Brighter days.</span><span className="announce-paw" aria-hidden="true">✦</span><span>For every happy tail</span></div>
    <header className="site-header" id="top">
      <Link className="brand-lockup" href="#top" aria-label="FGF Pet Food Bazaar home"><img src="/assets/logo-fgf.webp" alt="FGF Pet Food Bazaar" /></Link>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="fgf-main-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}><span /><span /></button>
      <nav id="fgf-main-nav" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation"><a href="#brands" onClick={() => setOpen(false)}>Our brands</a><a href="#shop" onClick={() => setOpen(false)}>Shop</a><a href="#journal" onClick={() => setOpen(false)}>Journal</a><a href="#community" onClick={() => setOpen(false)}>Community</a><a href="#contact" onClick={() => setOpen(false)}>Contact</a></nav>
      <a className="button button-dark header-shop" href="#shop">Find a favorite <span aria-hidden="true">→</span></a>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer id="contact" className="site-footer">
    <a className="pdf-contact-banner" href="mailto:info@fgfpetfoodbazaar.com" aria-label="Email FGF Pet Food Bazaar"><img src="/assets/fgf-pdf-contact.webp" alt="A friendly golden retriever wearing a headset beside an FGF laptop" /></a>
    <div className="footer-main section-wrap">
      <div className="footer-brand"><a href="#top"><img src="/assets/logo-fgf.webp" alt="FGF Pet Food Bazaar" /></a><p>Better food. Happier pets. More little moments worth keeping.</p><span className="footer-sparkle">✦ ✿ ✦</span></div>
      <div><h3>Take a look</h3><a href="#brands">Our brands</a><a href="#shop">Shop</a><a href="#journal">Journal</a><a href="#community">Community</a></div>
      <div className="footer-contact"><h3>Say hello</h3><a href="tel:+18325550188">☎ +1 (832) 555-0188</a><a href="mailto:info@fgfpetfoodbazaar.com">✉ info@fgfpetfoodbazaar.com</a><a href="https://www.fgfpetfood.com/" target="_blank" rel="noreferrer">Current FGF website ↗</a></div>
      <div className="footer-note"><span aria-hidden="true">🐾</span><strong>Good food.<br />Good company.</strong><small>Happier days start here!</small></div>
    </div>
    <div className="footer-bottom section-wrap"><span>© FGF Pet Food Bazaar</span><span>Made with a little extra tail-wag.</span><a href="#top">Back to top ↑</a></div>
  </footer>;
}
