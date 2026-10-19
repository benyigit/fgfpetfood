import Link from "next/link";
import type { Metadata } from "next";
import { ProductExplorer } from "@/components/product-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Shop the Bazaar — FGF Pet Food",
  description: "Browse playful pet favorites and natural chews at FGF Pet Food Bazaar.",
};

export default function ShopPage() {
  return <>
    <SiteHeader />
    <main>
      <section className="bazaar-shop-hero">
        <div className="section-wrap bazaar-shop-hero-inner">
          <div className="bazaar-shop-copy">
            <p className="eyebrow">A happy place for snack time</p>
            <h1>Find their next <em>happy favorite.</em></h1>
            <p>Browse thoughtful chews and little treats picked for curious noses, wagging tails and everyday good moments.</p>
            <Link className="button button-dark" href="/#happy-box">Build their happy box <span aria-hidden="true">→</span></Link><div className="bazaar-shop-perks"><span>🐾 Pet-first picks</span><span>✿ Happy little rituals</span></div>
          </div>
          <div className="bazaar-shop-art"><img src="/assets/products/beef-lung.webp" alt="A FGF Pet Food Bazaar beef lung treat package" /><span>Good<br />choice!</span></div>
        </div>
      </section>
      <section className="section-wrap bazaar-shop-catalog" aria-labelledby="bazaar-products-title">
        <div className="section-heading shop-page-heading">
          <div><p className="eyebrow">The treat shelf</p><h2 id="bazaar-products-title">Little favorites for <em>big tail wags.</em></h2></div>
          <p>Use the filters to find a chew, then save the ones you’d like to come back to.</p>
        </div>
        <ProductExplorer />
      </section>
    </main>
    <SiteFooter />
  </>;
}
