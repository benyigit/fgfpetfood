"use client";

import { useLanguage } from "@/components/language-provider";
import details from "@/data/product-details.json";
export function ProductFacts({
  productId
}: {
  productId: string;
}) {
  const {
    t,
    language
  } = useLanguage();
  const facts = details[productId as keyof typeof details];
  if (!facts) return null;
  return <div className="product-facts"><h3>{t("What makes it special")}</h3><ul>{t(facts.features.map(feature => <li key={feature}>{t(feature)}</li>))}</ul><dl><div><dt>{t("Ingredient")}</dt><dd>{t(facts.ingredient)}</dd></div><div><dt>{t("Size & shape")}</dt><dd>{t(facts.size)}</dd></div><div><dt>{t("Texture")}</dt><dd>{t(facts.texture)}</dd></div></dl><h3>{t("How to enjoy")}</h3><p>{t("Offer as an occasional treat, with fresh water and supervision. Choose a size suited to your dog and remove small remaining pieces. Treats do not replace a complete diet.")}</p><small>{t("Check the current package for the full ingredient list and feeding instructions.")}</small></div>;
}
