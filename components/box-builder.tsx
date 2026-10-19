"use client";

import { useEffect, useState } from "react";
import { products } from "@/data/products";
import styles from "./box-builder.module.css";

const storageKey = "fgf-happy-box-v1";
type Box = { size: number; items: string[]; name: string };
const emptyBox: Box = { size: 3, items: [], name: "" };

export function BoxBuilder() {
  const [box, setBox] = useState<Box>(emptyBox);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && [3, 6].includes(saved.size) && Array.isArray(saved.items) && saved.items.length <= saved.size && saved.items.every((id: unknown) => typeof id === "string" && products.some((p) => p.id === id)) && typeof saved.name === "string" && saved.name.length <= 24) setBox(saved);
    } catch { /* Storage is optional. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(storageKey, JSON.stringify(box)); } catch { /* Download remains available. */ }
  }, [box, ready]);

  const full = box.items.length === box.size;
  const selected = products.filter((p) => box.items.includes(p.id));
  const shown = products.filter((p) => filter === "all" || p.group === filter);
  const boxTitle = box.name.trim() ? `${box.name.trim()}’s happy box` : "Your happy box";
  const summary = `${boxTitle}\n\n${selected.map((p) => `${box.items.filter((id) => id === p.id).length} × ${p.name}`).join("\n")}\n\n${box.items.length} of ${box.size} picks\nPlease confirm prices and availability.\nFGF Pet Food Bazaar`;

  function add(id: string) {
    if (full) return;
    setBox((previous) => previous.items.length < previous.size ? { ...previous, items: [...previous.items, id] } : previous);
    setStatus(`${products.find((p) => p.id === id)?.name} added to your box.`);
  }
  function remove(index: number) {
    setBox((previous) => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }));
    setStatus("Pick removed. There’s room for another favourite.");
  }
  function save() {
    const url = URL.createObjectURL(new Blob([summary], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "my-fgf-happy-box.txt"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Your box list is ready to save. Keep it for your next treat shop.");
  }

  return <section className={`${styles.section} section-wrap`} id="happy-box" aria-labelledby="box-title">
    <div className={styles.heading}><div><p className="eyebrow">A little box of their favourite things</p><h2 id="box-title">You pick.<br /><em>They do the happy dance.</em></h2></div><div className={styles.headingNote}><span aria-hidden="true">✳</span><p>Mix, match and make it theirs. Build a wish list for your favourite little snacker.</p></div></div>
    <div className={styles.mobileSummary}><span aria-live="polite"><strong>{box.items.length}/{box.size}</strong> happy picks</span><a href="#happy-box-summary">View your box <span aria-hidden="true">↓</span></a></div>
    <div className={styles.builder}>
      <div className={styles.shelf}>
        <div className={styles.controls}><fieldset><legend>01 · Pick your box size</legend>{[3, 6].map((size) => <button type="button" key={size} aria-pressed={box.size === size} disabled={size < box.items.length} onClick={() => { setBox((previous) => ({ ...previous, size })); setStatus(""); }}>{size} happy picks</button>)}</fieldset><button className={styles.mixButton} disabled={box.items.length > 0} onClick={() => { setBox((previous) => ({ ...previous, items: previous.size === 3 ? ["beef-lung", "cow-ear", "lamb-tripe"] : products.map((p) => p.id) })); setStatus("A little of everything, ready to make your own."); }}>Surprise me ✦</button></div>
        <div className={styles.filters} role="group" aria-label="Box product filters">{[["all", "All the treats"], ["beef", "Beefy chews"], ["crunchy", "Crunchy picks"], ["little", "Lamb"]].map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
        <div className={styles.productGrid}>{shown.map((p) => <article className={styles.product} key={p.id}><div className={styles.productPhoto}><img src={`/assets/products/${p.image}`} alt={p.name} loading="lazy" /><span>{p.kind}</span></div><h3>{p.name}</h3><div><small>{box.items.filter((id) => id === p.id).length ? `${box.items.filter((id) => id === p.id).length} in your box` : "A happy little pick"}</small><button disabled={full} onClick={() => add(p.id)} aria-label={`Add ${p.name} to box`}>+</button></div></article>)}</div>
      </div>
      <aside id="happy-box-summary" className={styles.boxPanel} aria-label="Your selected treats">
        <div className={styles.boxTop}><span>PACKED WITH PERSONALITY</span><span aria-hidden="true">♡</span></div>
        <label className={styles.nameLabel} htmlFor="box-dog-name">Made for<input id="box-dog-name" placeholder="Your dog’s name (optional)" maxLength={24} value={box.name} onChange={(event) => setBox((previous) => ({ ...previous, name: event.target.value }))} /></label>
        <h3>{boxTitle}</h3>
        <div className={styles.slots}>{Array.from({ length: box.size }, (_, index) => { const p = products.find((item) => item.id === box.items[index]); return <div key={index} className={`${styles.slot} ${p ? styles.filled : ""}`}>{p ? <><img src={`/assets/products/${p.image}`} alt={p.name} /><button onClick={() => remove(index)} aria-label={`Remove ${p.name} from slot ${index + 1}`}>×</button></> : <span aria-label={`Empty slot ${index + 1}`}>{index + 1}</span>}</div>; })}</div>
        <div className={styles.boxBand}><span>FGF</span><span>Pet Food Bazaar<br /><strong>A box full of tail wags.</strong></span><span aria-hidden="true">✷</span></div>
        <div className={styles.progress}><span>{full ? "One happy box, ready to keep." : "A few more tail wags to go…"}</span><strong>{box.items.length}/{box.size}</strong></div><progress max={box.size} value={box.items.length} aria-label="Box slots filled" />
        <p className={styles.explainer}>Save your favourites or ask our team for prices and availability.</p>
        <button className="button button-dark" disabled={!box.items.length} onClick={save}>Save my box list <span aria-hidden="true">↓</span></button>
        {box.items.length > 0 && <a className={styles.emailLink} href={`mailto:info@fgfpetfoodbazaar.com?subject=${encodeURIComponent(boxTitle)}&body=${encodeURIComponent(summary)}`}>Ask about this box ↗</a>}
        {box.items.length > 0 && <button className={styles.clear} onClick={() => { setBox((previous) => ({ ...previous, items: [] })); setStatus("Your box is empty and ready for new favourites."); }}>Empty box</button>}
        <p className={styles.status} role="status">{status}</p>
      </aside>
    </div>
  </section>;
}
