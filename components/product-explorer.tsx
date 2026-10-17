"use client";

import { useMemo, useState } from "react";

const products = [
  { id: "bully-stick-6", name: "6-inch Bully Stick", kind: "BEEF CHEW", group: "beef", image: "bully-stick-6.webp", description: "A familiar chew in a handy 6-inch format. A satisfying little ritual for dogs who love to settle in and chew." },
  { id: "beef-lung", name: "Beef Lung", kind: "BEEF CHEW", group: "crunchy", image: "beef-lung.webp", description: "A light, meaty treat with a crisp texture. A tasty little reward for treat time." },
  { id: "cow-ear", name: "Cow Ear", kind: "BEEF CHEW", group: "beef", image: "cow-ear.webp", description: "A naturally shaped chew with a different texture from an everyday biscuit." },
  { id: "chicken-feet", name: "Chicken Feet", kind: "CRUNCHY PICK", group: "crunchy", image: "chicken-feet.webp", description: "A distinctive animal-based chew with a naturally crunchy texture and plenty of character." },
  { id: "lamb-tripe", name: "Lamb Tripe", kind: "LAMB CHEW", group: "little", image: "lamb-tripe.webp", description: "A flavorful lamb chew with a distinctive aroma dogs love to investigate." },
  { id: "bully-stick-12", name: "12-inch Bully Stick", kind: "BEEF CHEW", group: "beef", image: "bully-stick-12.webp", description: "A longer format for dogs who enjoy a more substantial chew. Choose a size suited to your dog." },
];

export function ProductExplorer() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<(typeof products)[number] | null>(null);
  const shown = useMemo(() => products.filter((p) => (filter === "all" || p.group === filter) && (!favoritesOnly || saved.includes(p.id)) && `${p.name} ${p.kind} ${p.description}`.toLowerCase().includes(query.toLowerCase())), [filter, favoritesOnly, query, saved]);

  function toggleSaved(id: string) {
    setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  return <>
    <div className="filter-row" role="group" aria-label="Filter products">
      {[ ["all", "Everything"], ["beef", "Beefy chews"], ["crunchy", "Crunchy picks"], ["little", "Little chews"] ].map(([key, label]) => <button key={key} className={`filter-chip ${filter === key && !favoritesOnly ? "is-active" : ""}`} type="button" onClick={() => { setFilter(key); setFavoritesOnly(false); }}>{label}</button>)}
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Find a favorite" aria-label="Search treats" /></label>
      <button className={`filter-chip ${favoritesOnly ? "is-active" : ""}`} type="button" onClick={() => setFavoritesOnly((value) => !value)}>♡ Saved ({saved.length})</button>
    </div>
    <div className="product-grid" aria-live="polite">{shown.map((product) => <article className="product-card" key={product.id}>
      <div className="product-image-wrap"><img src={`/assets/products/${product.image}`} alt={`${product.name} treat`} loading="lazy" /><span className="product-sticker">{product.kind}</span><button className={`save-button ${saved.includes(product.id) ? "is-saved" : ""}`} type="button" aria-label={`${saved.includes(product.id) ? "Remove" : "Save"} ${product.name}`} onClick={() => toggleSaved(product.id)}>{saved.includes(product.id) ? "♥" : "♡"}</button></div>
      <div className="product-card-body"><span className="product-kind">FGF Pet Food Bazaar</span><h3>{product.name}</h3><p>{product.description}</p><button className="card-action" type="button" onClick={() => setSelected(product)}>Take a closer look <span aria-hidden="true">↗</span></button></div>
    </article>)}</div>
    {shown.length === 0 && <p className="empty-state">No treats match that search yet. Try another sniff around.</p>}
    <div className="shop-footnote"><span className="footnote-paw" aria-hidden="true">🐾</span><span>Product details and availability can be added when the shop is connected.</span><a className="text-link" href="#brands">Meet our brands ↗</a></div>
    {selected && <dialog className="site-dialog" open aria-labelledby="product-title"><button className="dialog-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button><div className="dialog-product"><img src={`/assets/products/${selected.image}`} alt={selected.name} /><div><span className="product-kind">{selected.kind}</span><h2 id="product-title">{selected.name}</h2><p>{selected.description}</p><p>Offer chews with supervision, fresh water and a size that suits your dog.</p><button className="button button-dark" type="button" onClick={() => toggleSaved(selected.id)}>♡ Save this favorite</button></div></div></dialog>}
  </>;
}
