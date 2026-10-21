'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLanguage } from './language-provider';
import { SharingChoices } from './sharing-choices';
import { prepareCommunityPhoto } from '@/lib/prepare-community-photo';
import s from './community-composer.module.css';

type Member = { name: string; dog_name: string };
type Category = 'cosy' | 'outdoors' | 'funny';
const categories: [Category, string, string][] = [['cosy', 'Cosy moments', '☀'], ['outdoors', 'Outdoor days', '✿'], ['funny', 'Funny moments', '☺']];

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({ error: 'Please try again.' }));
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data;
}

export function CommunityComposer({ brand, onClose, onSaved }: {
  brand: 'quipaw' | 'fgf'; onClose: () => void; onSaved: () => void;
}) {
  const { t, language } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<'compose' | 'auth' | 'done'>('compose');
  const [member, setMember] = useState<Member | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [dogName, setDogName] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<Category>('cosy');
  const [website, setWebsite] = useState(false);
  const [social, setSocial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const node = dialog.current;
    const previous = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = 'hidden';
    const controller = new AbortController();
    request('/api/community/auth', { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return;
      if (data.available === false) throw new Error('Photo sharing is temporarily unavailable. Please try again shortly.');
      setMember(data.member);
      if (data.member?.dog_name) setDogName(current => current || data.member.dog_name);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => {
      controller.abort();
      node?.close();
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy || checking) return;
    setError('');
    if (!member) { setStep('auth'); return; }
    setBusy(true);
    try {
      const body = new FormData();
      body.set('photo', await prepareCommunityPhoto(file), 'happy-moment.webp');
      body.set('dog_name', dogName.trim());
      body.set('title', title.trim());
      body.set('caption', caption.trim());
      body.set('category', category);
      body.set('consent', String(website));
      body.set('social_consent', String(social));
      body.set('language', language);
      const response = await fetch('/api/community/photos', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setMember(null); setMode('login'); setStep('auth');
        throw new Error('Please sign in to continue.');
      }
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      window.dispatchEvent(new Event('community:updated'));
      try { localStorage.setItem('community-update', String(Date.now())); } catch {}
      onSaved();
      setStep('done');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      const data = await request('/api/community/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, name: fields.get('name'), email: fields.get('email'), password: fields.get('password') })
      });
      form.reset();
      setMember(data.member);
      setStep('compose');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const close = () => { if (!busy) onClose(); };
  const categoryLabel = categories.find(([value]) => value === category)![1];
  return <dialog ref={dialog} className={`${s.dialog} ${brand === 'fgf' ? s.fgf : ''}`} aria-labelledby="compose-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className={s.top}><span>{brand === 'quipaw' ? 'Quipaw.' : 'FGF Pet Food Bazaar'}</span><span>{t('The happy tails scrapbook')}</span><button type="button" onClick={close} disabled={busy} aria-label={t('Close gallery window')}>×</button></div>
    <div className={s.content} ref={content}>
      <div className={s.layout}>
        <aside className={s.previewColumn}>
          <p className={s.previewLabel}>{t(step === 'done' ? 'A little memory to keep' : 'A little peek at their moment')}</p>
          <div className={s.polaroid}>
            <div className={s.photo}>{preview ? <img src={preview} alt={t('Your selected photo')} /> : <div><span aria-hidden="true">♡</span><strong>{t('A very good dog goes here.')}</strong><small>{t('Add a photo to make it theirs.')}</small></div>}</div>
            <span className={s.tag}>{t(categoryLabel)}</span>
            <h3>{title || t('Their little moment.')}</h3>
            <p>{caption || t('A tiny story. A whole lot of happy.')}</p>
            <div className={s.signature}><span>{dogName || t('Your good dog')}</span><span aria-hidden="true">♡</span></div>
          </div>
          <p className={s.previewNote}>{t('Their photo. Their story. Your choice.')}</p>
        </aside>
        <div className={s.editor}>
          <p className="eyebrow">{t(step === 'done' ? 'One more happy memory' : step === 'auth' ? 'Keep their moment safe' : 'Made of little tail wags')}</p>
          <h2 ref={heading} tabIndex={-1} id="compose-title">{t(step === 'done' ? 'A moment worth keeping.' : step === 'auth' ? 'One little hello.' : 'Tell their happy story.')}</h2>
          {step === 'compose' && <>
            <p className={s.intro}>{t('Choose a photo, give it a little story and decide who gets to see it.')}</p>
            <form className={s.form} onSubmit={save}>
              <fieldset disabled={busy}>
                <label className={s.upload}><span aria-hidden="true">＋</span><span><strong>{t(file ? 'Change their photo' : 'Choose their photo')}</strong><small>JPG · PNG · WebP · 8 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" required={!file} onChange={event => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  if (selected.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
                    setError('Choose a JPG, PNG or WebP photo under 8 MB.'); event.target.value = ''; return;
                  }
                  setError(''); setFile(selected);
                }} /></label>
                <label>{t('Their name')}<input value={dogName} onChange={e => setDogName(e.target.value)} maxLength={40} required placeholder={t('e.g. Charlie')} /></label>
                <fieldset className={s.categories}><legend>{t('What kind of moment?')}</legend><div>{categories.map(([value, label, icon]) => <label key={value}><input type="radio" name="moment-category" value={value} checked={category === value} onChange={() => setCategory(value)} /><span><i aria-hidden="true">{icon}</i>{t(label)}</span></label>)}</div></fieldset>
                <label>{t('Give it a title')}<input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required placeholder={t('The best seat in the house.')} /></label>
                <label>{t('A little story')}<textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={240} rows={3} required placeholder={t('What made their tail wag today?')} /><small className={s.count}>{caption.length}/240</small></label>
              </fieldset>
              <SharingChoices website={website} social={social} onWebsite={setWebsite} onSocial={setSocial} disabled={busy} />
              {error && <p className={s.error} role="alert">{t(error)}</p>}
              <div className={s.actions}><button type="submit" className="button button-dark" disabled={busy || checking || !file}>{t(busy ? 'Saving…' : checking ? 'One little moment…' : !member ? 'Continue to save their moment' : website ? 'Share their happy moment' : 'Save their moment')} <span aria-hidden="true">→</span></button><small>{member ? `${t('Signed in as')} ${member.name}` : t('Sign in or create an account here to keep control of your photos.')}</small></div>
            </form>
          </>}
          {step === 'auth' && <>
            <p className={s.intro}>{t('Your photo and story are ready. Sign in or join the pack to save them. You’ll stay right here.')}</p>
            <div className={s.authTabs}><button type="button" disabled={busy} aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(''); }}>{t('Create account')}</button><button type="button" disabled={busy} aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>{t('Sign in')}</button></div>
            <form className={s.form} onSubmit={authenticate}><fieldset disabled={busy}>
              {mode === 'register' && <label>{t('Your name')}<input name="name" autoComplete="name" required maxLength={60} /></label>}
              <label>{t('Email address')}<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
              <label>{t('Password')}<input type="password" name="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={10} maxLength={128} required /><small>{t('At least 10 characters.')}</small></label>
            </fieldset>{error && <p className={s.error} role="alert">{t(error)}</p>}<button type="submit" className="button button-dark" disabled={busy}>{t(busy ? 'One little moment…' : mode === 'register' ? 'Create my account →' : 'Sign in →')}</button></form>
            <button className={s.back} type="button" disabled={busy} onClick={() => { setStep('compose'); setError(''); }}>← {t('Back to my moment')}</button>
            <p className={s.intro}>{t('Your email and account name stay private.')}</p>
          </>}
          {step === 'done' && <div className={s.done} role="status"><span aria-hidden="true">♡</span><p>{t(website ? 'Their happy moment is now in the scrapbook, alongside the rest of our pack.' : social ? 'Saved outside the public gallery. Only you and the brand team can access it for the social sharing you allowed.' : 'Saved just for you. Your photo is not visible to other visitors or the brand team.')}</p><div className={s.permissionSummary}><span>{t(website ? 'Website · shared' : 'Website · private')}</span><span>{t(social ? 'Social · permission given' : 'Social · no permission')}</span></div><button type="button" className="button button-dark" onClick={onClose}>{t(website ? 'See it in the scrapbook' : 'Back to happy moments')} <span aria-hidden="true">→</span></button><small>{t('You can change your permissions or delete this memory in My account & photos.')}</small></div>}
        </div>
      </div>
    </div>
  </dialog>;
}
