"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./language-provider";
import styles from "./contact-message-form.module.css";

export function ContactMessageForm({ heading = false }: { heading?: boolean }) {
  const { t } = useLanguage();
  const formId = useId();
  const busy = useRef(false);
  const attempt = useRef({ payload: "", requestId: "" });
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = { name: String(data.get("name") || "").trim(), email: String(data.get("email") || "").trim(), subject: String(data.get("subject") || ""), message: String(data.get("message") || "").trim(), website: String(data.get("website") || "") };
    if (!payload.name || !payload.message) { setStatus({ error: true, text: "Please add your name and a message." }); return; }
    const signature = JSON.stringify(payload);
    if (attempt.current.payload !== signature) attempt.current = { payload: signature, requestId: crypto.randomUUID() };
    busy.current = true; setPending(true); setStatus(null);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: attempt.current.requestId }), signal: AbortSignal.timeout(25000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Your message could not be sent. Please try again.");
      form.reset(); attempt.current = { payload: "", requestId: "" };
      setStatus({ error: false, text: "Your message has been sent to our team. Thank you for getting in touch!" });
    } catch (error) {
      setStatus({ error: true, text: error instanceof Error && error.name !== "TimeoutError" ? error.message : "We couldn’t confirm delivery. Your message is still here; please try again." });
    } finally { busy.current = false; setPending(false); }
  }
  return <form className={styles.form} onSubmit={send} aria-label={t("Contact our team")} aria-busy={pending}>
    {heading && <div><p className="eyebrow">{t("A friendly hello")}</p><h3>{t("Leave us a little note.")}</h3></div>}
    <div className={styles.row}>
      <label htmlFor={`${formId}-name`}>{t("Your name")}<input id={`${formId}-name`} name="name" autoComplete="name" required maxLength={80} placeholder={t("The human’s name")} /></label>
      <label htmlFor={`${formId}-email`}>{t("Email address")}<input id={`${formId}-email`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
    </div>
    <label htmlFor={`${formId}-subject`}>{t("What can we help with?")}<select id={`${formId}-subject`} name="subject" defaultValue="A question about a product">{["A question about a product", "Retail & wholesale", "Partnerships", "Something else"].map(subject => <option key={subject} value={subject}>{t(subject)}</option>)}</select></label>
    <label htmlFor={`${formId}-message`}>{t("Your message")}<textarea id={`${formId}-message`} name="message" required rows={5} maxLength={5000} placeholder={t("Tell us what’s on your mind…")} /></label>
    <div className={styles.honeypot} aria-hidden="true"><label htmlFor={`${formId}-website`}>Website<input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
    <button type="submit" className="button button-dark" disabled={pending}>{t(pending ? "Sending…" : "Send mail")} <span aria-hidden="true">→</span></button>
    <p className={styles.note}>{t("We’ll reply using the email address you provide.")}</p>
    {status && <p className={`${styles.status} ${status.error ? styles.error : ""}`} role={status.error ? "alert" : "status"}>{t(status.text)}</p>}
  </form>;
}
