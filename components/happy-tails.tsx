"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./happy-tails.module.css";

type Brand = "quipaw" | "fgf";
const moments = [
  { title: "The best seat in the house.", tag: "Cosy moments", category: "cosy", image: "cow-ear-story.webp", alt: "A dog enjoying a cow ear on a sunny sofa", note: "A sunny spot, a favourite chew and absolutely nowhere else to be." },
  { title: "A little garden adventure.", tag: "Outdoor days", category: "outdoors", image: "bully-stick-story.webp", alt: "A dog enjoying treat time outdoors", note: "Fresh air, a curious nose and a well-earned pause in the garden." },
  { title: "That treat-time look.", tag: "Cosy moments", category: "cosy", image: "chicken-feet-story.jpg", alt: "A dog beside a pack of chicken feet treats", note: "The little everyday rituals that make life with dogs so good." },
];

function MomentDialog({ brand, index, onClose }: { brand: Brand; index: number | "submit"; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const email = brand === "quipaw" ? "support@quipaw.com" : "info@fgfpetfoodbazaar.com";
  const story = typeof index === "number" ? moments[index] : null;
  useEffect(() => {
    const node = dialog.current; const previousOverflow = document.body.style.overflow;
    node?.showModal(); document.body.style.overflow = "hidden";
    return () => { node?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  useEffect(() => {
    if (!file) { setPhoto(""); return; }
    const url = URL.createObjectURL(file); setPhoto(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !caption.trim()) { setError("Add your dog’s name and a little story first."); return; }
    const body = `Happy Tails submission\n\nDog’s name: ${name.trim()}\nStory: ${caption.trim()}\n\nI own this photo and give permission to publish it with my dog’s name and story after review.\n\n${file ? `Photo to attach: ${file.name}` : "I will attach my dog’s photo to this email."}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Happy Tails: ${name.trim()}`)}&body=${encodeURIComponent(body)}`;
    setStatus("Your email app will open a draft. Attach your photo, then send it to our team for review.");
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="tail-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <button className={styles.close} type="button" aria-label="Close gallery window" onClick={onClose}>×</button>
    {story ? <div className={styles.storyDetail}><img src={`/assets/stories/${story.image}`} alt={story.alt} /><div><p className="eyebrow">From our brand scrapbook</p><h3 id="tail-dialog-title">{story.title}</h3><p>{story.note}</p><a className="button button-dark" href={brand === "quipaw" ? "/blog" : "/#journal"} onClick={onClose}>Explore the journal <span aria-hidden="true">→</span></a></div></div> : <div className={styles.submission}>
      <div className={styles.preview}><div className={styles.previewPhoto}>{photo ? <img src={photo} alt="Your selected dog photo preview" onError={() => { setError("We couldn’t read that photo. Please choose another JPG, PNG or WebP."); setFile(null); if (photoInput.current) photoInput.current.value = ""; }} /> : <><span aria-hidden="true">♡</span><strong>Your good dog<br />belongs here.</strong></>}</div><h3>{name.trim() || "A very good dog"}</h3><p>{caption.trim() || "A little moment worth keeping."}</p><span className={styles.previewBadge}>YOUR PRIVATE PREVIEW</span></div>
      <form onSubmit={submit} className={styles.form}><p className="eyebrow">Make a little memory</p><h3 id="tail-dialog-title">Meet our next<br /><em>happy tail.</em></h3><p>Tell us about your dog. We review every story before adding it to the gallery.</p>
        <label>Their name<input required maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Charlie" /></label>
        <label>A little story<textarea required maxLength={240} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What made their tail wag today?" /></label>
        <label className={styles.upload}>Preview your photo <small>Optional · JPG, PNG or WebP · up to 8 MB</small><input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setError(""); const next = event.target.files?.[0]; if (!next) return; if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || next.size > 8 * 1024 * 1024) { setError("Choose a JPG, PNG or WebP photo under 8 MB."); event.target.value = ""; setFile(null); return; } setFile(next); }} /></label>
        {file && <button type="button" className={styles.removePhoto} onClick={() => { setFile(null); if (photoInput.current) photoInput.current.value = ""; }}>Remove preview photo</button>}
        <label className={styles.consent}><input type="checkbox" required /><span>I own this photo and agree to share it with my dog’s name and story in the gallery after review.</span></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className="button button-dark" type="submit">Open email draft <span aria-hidden="true">↗</span></button>
        <small className={styles.hint}>Attach the photo in your email before sending. The preview stays on your device.</small>
        <p className={styles.status} role="status">{status}</p>
      </form>
    </div>}
  </dialog>;
}

export function HappyTails({ brand }: { brand: Brand }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | "submit" | null>(null);
  return <section id="happy-tails" className={`${styles.section} section-wrap ${brand === "fgf" ? styles.fgf : ""}`} aria-labelledby="tails-title">
    <div className={styles.header}><div><p className="eyebrow">The happy tails scrapbook</p><h2 id="tails-title">Little moments.<br /><em>Ridiculously happy dogs.</em></h2></div><div className={styles.invite}><span aria-hidden="true">♡</span><p>A few favourites from our brand scrapbook.<br />The next page could be your dog’s.</p><button className="button button-dark" onClick={() => setOpen("submit")}>Share their happy moment <span aria-hidden="true">↗</span></button></div></div>
    <div className={styles.filters} role="group" aria-label="Filter happy moments">{[["all", "All the good times"], ["cosy", "Cosy moments"], ["outdoors", "Outdoor days"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}<span>Made of little tail wags ✦</span></div>
    <div className={styles.grid}>{moments.map((moment, index) => (filter === "all" || moment.category === filter) && <button className={styles.polaroid} key={moment.title} onClick={() => setOpen(index)} aria-label={`View ${moment.title}`}><div className={styles.photo}><img src={`/assets/stories/${moment.image}`} alt={moment.alt} loading="lazy" /><span aria-hidden="true">↗</span></div><span className={styles.tag}>{moment.tag}</span><strong>{moment.title}</strong><span className={styles.signature}>From the {brand === "quipaw" ? "Quipaw" : "FGF"} scrapbook <span aria-hidden="true">♡</span></span></button>)}</div>
    <div className={styles.bottom}><span aria-hidden="true">✷</span><p>Every happy tail has a story. <strong>We’d love to hear yours.</strong></p><button onClick={() => setOpen("submit")}>Meet the next good dog →</button></div>
    {open !== null && <MomentDialog brand={brand} index={open} onClose={() => setOpen(null)} />}
  </section>;
}
