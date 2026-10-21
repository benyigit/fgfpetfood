"use client";

import Link from "next/link";
import { CommunityComposer } from "./community-composer";
import { useCommunityPhotos } from "./use-community-photos";
import { BrandVideos } from "./brand-videos";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useRef, useState } from "react";
import styles from "./happy-tails.module.css";
type Brand = "quipaw" | "fgf";
type Moment = {
  id: string;
  title: string;
  tag: string;
  category: string;
  image: string;
  alt: string;
  note: string;
  community: boolean;
};
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
  story,
  onClose,
  onShare
}: {
  brand: Brand;
  story: Moment;
  onClose: () => void;
  onShare: () => void;
}) {
  const {
    t
  } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);

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
      <img src={story.image} alt={story.community ? story.alt : t(story.alt)} />
      <div>
        <p className="eyebrow">{t(story.community ? "From our happy tails community" : "From our brand scrapbook")}</p>
        <h3 id="tail-dialog-title">{story.community ? story.title : t(story.title)}</h3>
        <p>{story.community ? story.note : t(story.note)}</p>
        {story.community && <p className={styles.permissionNote}>{t("Shared with their human’s permission.")}</p>}
        {story.community ? <button type="button" className="button button-dark" onClick={onShare}>{t("Share your own happy moment")} <span aria-hidden="true">→</span></button> : <Link className="button button-dark" href="/blog" onClick={onClose}>{t("Explore the journal")} <span aria-hidden="true">→</span></Link>}
      </div>
    </div>
  </dialog>;
}
export function HappyTails({ brand }: { brand: Brand }) {
  const { t } = useLanguage();
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const { photos, loading, failed, refresh } = useCommunityPhotos();
  const stories: Moment[] = [
    ...photos.map(photo => ({
      id: photo.id,
      title: photo.title || photo.dog_name,
      tag: ({ cosy: "Cosy moments", outdoors: "Outdoor days", funny: "Funny moments" } as Record<string, string>)[photo.category] || "Community moments",
      category: photo.category || "community",
      image: `/api/community/photos/${photo.id}`,
      alt: photo.caption || photo.dog_name,
      note: photo.caption,
      community: true
    })),
    ...moments.map((moment, index) => ({
      ...moment, id: `brand-${index}`, image: `/assets/stories/${moment.image}`, community: false
    }))
  ];
  const visible = stories.filter(story => filter === "all" || (filter === "community" ? story.community : story.category === filter));
  const openStory = stories.find(story => story.id === openId);

  return <section id="happy-tails" className={`${styles.section} section-wrap ${brand === "fgf" ? styles.fgf : ""}`} aria-labelledby="tails-title">
    <div className={styles.header}>
      <div><p className="eyebrow">{t("The happy tails scrapbook")}</p><h2 id="tails-title">{t("Little moments.")}<br /><em>{t("Truly happy dogs.")}</em></h2></div>
      <div className={styles.invite}><span aria-hidden="true">♡</span><p>{t("Little stories from our pack, and yours.")}<br />{t("The next page could be your dog’s.")}</p><button type="button" className="button button-dark" onClick={() => setComposing(true)}>{t("Share their happy moment ")}<span aria-hidden="true">＋</span></button></div>
    </div>
    <div className={styles.filters} role="group" aria-label={t("Filter happy moments")}>
      {[["all", "All the good times"], ["cosy", "Cosy moments"], ["outdoors", "Outdoor days"], ["funny", "Funny moments"], ["community", "Community moments"]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(label)}</button>)}
      <span>{t("Made of little tail wags ✦")}</span>
    </div>
    <div className={styles.grid} aria-busy={loading}>
      {visible.map(moment => <button type="button" className={`${styles.polaroid} ${moment.community ? styles.communityCard : ""}`} key={moment.id} onClick={() => setOpenId(moment.id)} aria-label={`${t("View moment:")} ${moment.community ? moment.title : t(moment.title)}`}>
        <div className={styles.photo}><img src={moment.image} alt={moment.community ? moment.alt : t(moment.alt)} loading="lazy" /><span aria-hidden="true">↗</span></div>
        <span className={styles.tag}>{t(moment.tag)}</span>
        <strong>{moment.community ? moment.title : t(moment.title)}</strong>
        {moment.community && <span className={styles.caption}>{moment.note}</span>}
        <span className={styles.signature}>{moment.community ? t("A little moment from our community") : `${t("From the ")}${brand === "quipaw" ? "Quipaw" : "FGF"}${t(" scrapbook ")}`}<span aria-hidden="true">♡</span></span>
      </button>)}
    </div>
    {!visible.length && <div className={styles.emptyState} role="status">
      <span aria-hidden="true">♡</span>
      <h3>{t(loading ? "Fetching a little happiness…" : failed ? "A little pause in the scrapbook." : "Their moment could be the first.")}</h3>
      {!loading && <><p>{t(failed ? "We couldn’t load the community photos. Please try again." : "Add a favourite photo and choose to share it on our website. It will appear right here.")}</p>{failed ? <button type="button" className="button button-dark" onClick={() => void refresh()}>{t("Try again")} <span aria-hidden="true">↻</span></button> : <button type="button" className="button button-dark" onClick={() => setComposing(true)}>{t("Share their happy moment ")}<span aria-hidden="true">＋</span></button>}</>}
    </div>}
    <div className={styles.bottom}><span aria-hidden="true">✷</span><p>{t("Every happy tail has a story. ")}<strong>{t("We’d love to hear yours.")}</strong></p><button type="button" onClick={() => setComposing(true)}>{t("Share a little happiness →")}</button></div>
    <BrandVideos />
    {composing && <CommunityComposer brand={brand} onClose={() => setComposing(false)} onSaved={() => { setFilter("all"); void refresh(); }} />}
    {openStory && <MomentDialog brand={brand} story={openStory} onClose={() => setOpenId(null)} onShare={() => { setOpenId(null); setComposing(true); }} />}
  </section>;
}
