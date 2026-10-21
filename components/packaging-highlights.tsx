"use client";

import { useLanguage } from "@/components/language-provider";
import styles from "./packaging-highlights.module.css";

// Wording comes from the supplied Quipaw packaging photographs.
const highlights = [{
  label: "100% Natural",
  icon: "leaf"
}, {
  label: "Single Ingredient",
  icon: "one"
}, {
  label: "Gluten Free",
  icon: "wheat"
}, {
  label: "No Artificial Flavors",
  icon: "flavor"
}, {
  label: "No Added Preservatives",
  icon: "flask"
}] as const;
function PackageIcon({
  kind
}: {
  kind: (typeof highlights)[number]["icon"];
}) {
  if (kind === "one") return <span className={styles.one} aria-hidden="true">1</span>;
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {kind === "leaf" && <><path d="M26 5C13 3 5 9 7 18c1 6 8 8 13 4 5-4 6-10 6-17Z" /><path d="M5 27 21 11M12 20v-6m0 6h6" /></>}
    {kind === "wheat" && <><path d="M16 26V7m0 4c-4 0-7-3-7-6 4 0 7 2 7 6Zm0 7c-4 0-7-3-7-6 4 0 7 2 7 6Zm0-7c4 0 7-3 7-6-4 0-7 2-7 6Zm0 7c4 0 7-3 7-6-4 0-7 2-7 6Z" /><path d="M5 27 27 5" strokeWidth="2.5" /></>}
    {kind === "flavor" && <><path d="M16 4S7 14 7 20a9 9 0 0 0 15 6m3-6c0-2-1-4-3-7M11 20c0 3 2 5 5 5M5 28 28 5" /></>}
    {kind === "flask" && <><path d="M12 4h8m-7 0v8L6 24c-1 2 0 4 3 4h14c3 0 4-2 3-4l-6-11M19 4v4M10 20h7M5 27 27 5" /><circle cx="20" cy="24" r="1" fill="currentColor" stroke="none" /></>}
  </svg>;
}
export function PackagingHighlights() {
  const {
    t
  } = useLanguage();
  return <section className={styles.strip} aria-label={t("Product packaging highlights")}>
    {highlights.map(({
      label,
      icon
    }) => <div className={styles.item} key={icon}>
      <span className={`${styles.seal} ${styles[icon]}`}><PackageIcon kind={icon} /></span>
      <strong>{t(label)}</strong>
    </div>)}
  </section>;
}
