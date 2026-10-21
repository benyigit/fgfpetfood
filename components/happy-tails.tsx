"use client";

import Link from "next/link";
import { CommunityFeed } from "./community-feed";
import { BrandVideos } from "./brand-videos";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useRef, useState } from "react";
import styles from "./happy-tails.module.css";
type Brand = "quipaw" | "fgf";
const moments = [{
  title: "The best seat in the house.",
  tag: "Cosy moments",
  category: "cosy",
  image: "cow-ear-story.webp",
  alt: "A dog enjoying a cow ear on a sunny sofa",
  note: "A sunny spot, a favourite chew and absolutely nowhere else to be."
}, {
  title: "A little garden adventure.",
  tag: "Outdoor days",
  category: "outdoors",
  image: "bully-stick-story.webp",
  alt: "A dog enjoying treat time outdoors",
  note: "Fresh air, a curious nose and a well-earned pause in the garden."
}, {
  title: "That treat-time look.",
  tag: "Cosy moments",
  category: "cosy",
  image: "chicken-feet-story.jpg",
  alt: "A dog beside a pack of chicken feet treats",
  note: "The little everyday rituals that make life with dogs so good."
}];
function MomentDialog({
  brand,
  index,
  onClose
}: {
  brand: Brand;
  index: number;
  onClose: () => void;
}) {
  const {
    t
  } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const story = moments[index];
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="tail-dialog-title" onCancel={event => {
    event.preventDefault();
    onClose();
  }} onClick={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <button className={styles.close} type="button" aria-label={t("Close gallery window")} onClick={onClose}>×</button>
    <div className={styles.storyDetail}>
      <img src={`/assets/stories/${story.image}`} alt={t(story.alt)} />
      <div>
        <p className="eyebrow">{t("From our brand scrapbook")}</p>
        <h3 id="tail-dialog-title">{t(story.title)}</h3>
        <p>{t(story.note)}</p>
        <Link className="button button-dark" href="/blog" onClick={onClose}>{t("Explore the journal ")}<span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </dialog>;
}
export function HappyTails({
  brand
}: {
  brand: Brand;
}) {
  const {
    t,
    language
  } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  return <section id="happy-tails" className={`${styles.section} section-wrap ${brand === "fgf" ? styles.fgf : ""}`} aria-labelledby="tails-title">
    <div className={styles.header}><div><p className="eyebrow">{t("The happy tails scrapbook")}</p><h2 id="tails-title">{t("Little moments.")}<br /><em>{t("Ridiculously happy dogs.")}</em></h2></div><div className={styles.invite}><span aria-hidden="true">♡</span><p>{t("A few favourites from our brand scrapbook.")}<br />{t("The next page could be your dog’s.")}</p><Link className="button button-dark" href="/account">{t("Share their happy moment ")}<span aria-hidden="true">↗</span></Link></div></div>
    <div className={styles.filters} role="group" aria-label={t("Filter happy moments")}>{t([["all", "All the good times"], ["cosy", "Cosy moments"], ["outdoors", "Outdoor days"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(label)}</button>))}<span>{t("Made of little tail wags ✦")}</span></div>
    <div className={styles.grid}>{t(moments.map((moment, index) => (filter === "all" || moment.category === filter) && <button className={styles.polaroid} key={moment.title} onClick={() => setOpen(index)} aria-label={t(`View ${moment.title}`)}><div className={styles.photo}><img src={`/assets/stories/${moment.image}`} alt={t(moment.alt)} loading="lazy" /><span aria-hidden="true">↗</span></div><span className={styles.tag}>{t(moment.tag)}</span><strong>{t(moment.title)}</strong><span className={styles.signature}>{t("From the ")}{t(brand === "quipaw" ? "Quipaw" : "FGF")}{t(" scrapbook ")}<span aria-hidden="true">♡</span></span></button>))}</div>
    <div className={styles.bottom}><span aria-hidden="true">✷</span><p>{t("Every happy tail has a story. ")}<strong>{t("We’d love to hear yours.")}</strong></p><Link href="/account">{t("Meet the next good dog →")}</Link></div>
    <CommunityFeed /><BrandVideos />
    {t(open !== null && <MomentDialog brand={brand} index={open} onClose={() => setOpen(null)} />)}
  </section>;
}
