"use client";

import { useLanguage } from "@/components/language-provider";
import Link from "next/link";
import { ProductExplorer } from "@/components/product-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
export default function ShopPage() {
  const {
    t,
    language
  } = useLanguage();
  return <>
    <SiteHeader />
    <main>
      <section className="bazaar-shop-hero">
        <div className="section-wrap bazaar-shop-hero-inner">
          <div className="bazaar-shop-copy">
            <p className="eyebrow">{t("A happy place for snack time")}</p>
            <h1>{t("Find their next ")}<em>{t("happy favorite.")}</em></h1>
            <p>{t("Browse thoughtful chews and little treats picked for curious noses, wagging tails and everyday good moments.")}</p>
            <Link className="button button-dark" href="/#happy-box">{t("Build their happy box ")}<span aria-hidden="true">→</span></Link><div className="bazaar-shop-perks"><span>{t("🐾 Pet-first picks")}</span><span>{t("✿ Happy little rituals")}</span></div>
          </div>
          <div className="bazaar-shop-art"><img src="/assets/products/beef-lung.webp" alt={t("A FGF Pet Food Bazaar beef lung treat package")} /><span>{t("Good")}<br />{t("choice!")}</span></div>
        </div>
      </section>
      <section className="section-wrap bazaar-shop-catalog" aria-labelledby="bazaar-products-title">
        <div className="section-heading shop-page-heading">
          <div><p className="eyebrow">{t("The treat shelf")}</p><h2 id="bazaar-products-title">{t("Little favorites for ")}<em>{t("big tail wags.")}</em></h2></div>
          <p>{t("Use the filters to find a chew, then save the ones you’d like to come back to.")}</p>
        </div>
        <ProductExplorer />
      </section>
    </main>
    <SiteFooter />
  </>;
}
