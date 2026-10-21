'use client';

import { useState, type FormEvent } from 'react';
import { useLanguage } from './language-provider';
import styles from './contact-form.module.css';
export function ContactForm() {
  const {
    language
  } = useLanguage();
  const [prepared, setPrepared] = useState(false);
  function compose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = `FGF Pet Food — ${String(data.get('topic'))}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:info@fgfpetfoodbazaar.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  }
  return <form className={styles.form} onSubmit={compose} aria-labelledby="fgf-contact-form-title">
    <div><p className="eyebrow">{'A friendly hello'}</p><h3 id="fgf-contact-form-title">{'Leave us a little note.'}</h3></div>
    <div className={styles.row}>
      <label>{'Your name'}<input name="name" autoComplete="name" required maxLength={80} placeholder={'The human’s name'} /></label>
      <label>{'Email address'}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
    </div>
    <label>{'What can we help with?'}<select name="topic" defaultValue="A question about a product"><option value="A question about a product">{'A question about a product'}</option><option value="Retail & wholesale">{'Retail & wholesale'}</option><option value="Partnerships">{'Partnerships'}</option><option value="Something else">{'Something else'}</option></select></label>
    <label>{'Your message'}<textarea name="message" required rows={4} maxLength={1500} placeholder={'Tell us what’s on your mind…'} /></label>
    <button type="submit" className="button button-dark">{'Open an email'} <span aria-hidden="true">↗</span></button>
    <p className={styles.note}>{'Your email app will open with your message ready. Send it from there to reach our team.'}</p>
    {prepared && <p className={styles.status} role="status">{'Your email draft is ready. If no app opened, you can email us directly at info@fgfpetfoodbazaar.com. Your message stays in this form.'}</p>}
  </form>;
}
