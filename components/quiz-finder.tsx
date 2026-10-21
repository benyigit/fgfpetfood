"use client";

import { useLanguage } from "@/components/language-provider";
import { useState } from "react";
const matches: Record<string, string> = {
  crunch: "Chicken Feet",
  settle: "Bully Stick",
  explore: "Cow Ear"
};
export function QuizFinder() {
  const {
    t,
    language
  } = useLanguage();
  const [step, setStep] = useState(0);
  const [match, setMatch] = useState("");
  return <section className="quiz-band section-wrap" aria-labelledby="quiz-title">
    <div className="quiz-illustration"><div className="quiz-orbit orbit-a" /><div className="quiz-orbit orbit-b" /><div className="quiz-ball">🐶</div><span className="quiz-spark spark-a">✦</span><span className="quiz-spark spark-b">✳</span></div>
    <div className="quiz-copy"><p className="eyebrow">{t("A two-minute tail-wagging detour")}</p><h2 id="quiz-title">{t("Find their ")}<em>{t("chew match.")}</em></h2>
      {t(step === 0 && <><p>{t("Pick a size and a chew mood. We’ll suggest a place to start—just for fun.")}</p><button className="button button-dark" type="button" onClick={() => setStep(1)}>{t("Take the quick quiz ")}<span aria-hidden="true">→</span></button></>)}
      {t(step === 1 && <div className="quiz-options"><p>{t("What kind of treat-time moment do they enjoy?")}</p>{t([["crunch", "A little crunch"], ["settle", "Settle in and chew"], ["explore", "A new texture"]].map(([key, label]) => <button className="quiz-option" key={key} type="button" onClick={() => {
          setMatch(matches[key]);
          setStep(2);
        }}>{t(label)}</button>))}</div>)}
      {t(step === 2 && <div className="quiz-result"><h3>{t("A little ")}{t(match.toLowerCase())}{t(" moment.")}</h3><p>{t("Use this as a playful starting point. Always supervise and choose a treat size suited to your dog.")}</p><button className="button button-dark" type="button" onClick={() => {
          setStep(0);
          setMatch("");
        }}>{t("Start again ")}<span aria-hidden="true">↻</span></button></div>)}
      <small>{t("Always supervise chew time and choose a size that suits your dog.")}</small>
    </div>
  </section>;
}
