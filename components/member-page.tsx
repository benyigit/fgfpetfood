'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { SiteHeader, SiteFooter } from './site-shell';
import { useLanguage } from './language-provider';
import { consentCopy } from '@/lib/community-consent';
import s from './member.module.css';
type Member = {
  id: string;
  email: string;
  name: string;
  dog_name: string;
  breed: string;
};
type Photo = {
  id: string;
  dog_name: string;
  caption: string;
  consent: number;
};
async function api(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store'
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Please try again.');
  return data;
}
function announce() {
  window.dispatchEvent(new Event('community:updated'));
  try {
    localStorage.setItem('community-update', String(Date.now()));
  } catch {}
}
export function MemberPage() {
  const {
    language,
    t
  } = useLanguage();
  const lang = 'en';
  const [available, setAvailable] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [consent, setConsent] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareConsent, setShareConsent] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error || status) feedback.current?.focus({
      preventScroll: true
    });
  }, [error, status]);
  async function reloadPhotos() {
    const data = await api('/api/community/photos');
    setPhotos(data.photos);
  }
  useEffect(() => {
    api('/api/community/auth').then(d => {
      setAvailable(d.available !== false);
      setMember(d.member);
      if (d.member) {
        setDogName(d.member.dog_name);
        setBreed(d.member.breed);
        return reloadPhotos();
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function submitAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const d = await api('/api/community/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode,
          email: data.get('email'),
          password: data.get('password'),
          name: data.get('name')
        })
      });
      setMember(d.member);
      setDogName(d.member.dog_name);
      setBreed(d.member.breed);
      form.reset();
      await reloadPhotos();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await api('/api/community/auth', {
        method: 'DELETE'
      });
      setMember(null);
      setPhotos([]);
      setFile(null);
      setCaption('');
      setConsent(false);
      setStatus('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('/api/community/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dog_name: dogName,
          breed
        })
      });
      setMember(d.member);
      setStatus('Their profile is saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const data = new FormData();
      data.set('photo', file);
      data.set('dog_name', dogName);
      data.set('caption', caption);
      data.set('consent', String(consent));
      data.set('language', language);
      await api('/api/community/photos', {
        method: 'POST',
        body: data
      });
      await reloadPhotos();
      setFile(null);
      setCaption('');
      setConsent(false);
      if (fileInput.current) fileInput.current.value = '';
      setStatus(consent ? 'Your moment is now in the public gallery.' : 'Saved privately. Only you can see this photo.');
      announce();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sharing(photoId: string, granted: boolean) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/community/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consent: granted,
          language
        })
      });
      await reloadPhotos();
      setShareId(null);
      setShareConsent(false);
      setStatus(granted ? 'Sharing permission saved.' : 'Permission withdrawn. This photo is now private and has been removed from the public gallery.');
      announce();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(photoId: string) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/community/photos/${photoId}`, {
        method: 'DELETE'
      });
      await reloadPhotos();
      setDeleteId(null);
      setStatus('Photo deleted.');
      announce();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <><SiteHeader /><main className={`${s.page} section-wrap`}>
 {loading ? <p role="status">{'Getting your little corner ready…'}</p> : !available ? <section className={s.comingSoon}><span className={s.bigPaw} aria-hidden="true">🐾</span><p className="eyebrow">{"The happy tails club"}</p><h1>{"A little corner."}<br /><em>{"Coming soon."}</em></h1><p>{"We’re getting a home ready for your dog’s happiest moments. Community accounts and photo sharing will open soon."}</p><Link className="button button-dark" href="/#happy-tails">{"Explore happy tails"} <span aria-hidden="true">↗</span></Link></section> : !member ? <div className={s.authLayout}>
  <div className={s.welcome}><span className={s.sticker}>GOOD<br />DOG CLUB</span><p className="eyebrow">{'A little place for your best friend'}</p><h1>{'Their story.'}<br /><em>{'Your little corner.'}</em></h1><p>{'Keep their photos, tell their story and choose which moments you’d like to share with our happy tails community.'}</p><img src="/assets/catalog/cow-ear/lifestyle-ai.webp" alt={'A gentle Cavalier beside a natural chew'} /><span className={s.welcomeNote}>{'Your photos. Your permission. Always.'}</span></div>
  <div className={s.authCard}><div className={s.tabs}><button aria-pressed={mode === 'login'} onClick={() => {
              setMode('login');
              setError('');
            }}>{'Sign in'}</button><button aria-pressed={mode === 'register'} onClick={() => {
              setMode('register');
              setError('');
            }}>{'Create account'}</button></div><h2>{mode === 'login' ? 'Welcome back, human.' : 'Let’s make a little memory.'}</h2><form onSubmit={submitAuth} className={s.form}>
  {mode === 'login' && <p className={s.authHint}>{'New here? Create your community account first.'} <button type="button" onClick={() => {
                setMode('register');
                setError('');
              }}>{'Create account →'}</button></p>}
  {mode === 'register' && <label>{'Your name'}<input name="name" autoComplete="name" required maxLength={60} /></label>}<label>{'Email address'}<input type="email" name="email" autoComplete="email" required maxLength={254} /></label><label>{'Password'}<input type="password" name="password" minLength={10} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /><small>{'At least 10 characters.'}</small></label><button disabled={busy} className="button button-dark">{busy ? 'One little moment…' : mode === 'login' ? 'Sign in →' : 'Create my account →'}</button><p className={s.hint}>{'Your account details stay private. Photo sharing is optional and can be withdrawn at any time.'}</p></form></div></div> : <><div className={s.dashboardHeading}><div><p className="eyebrow">{'Your happy tails club'}</p><h1>{'Hello,'} <em>{member.name}.</em></h1><p>{'A little home for their happiest moments.'}</p></div><button className={s.outlineButton} onClick={logout} disabled={busy}>{'Sign out'} ↗</button></div>
 <div className={s.dashboard}><aside className={s.profile}><span className={s.bigPaw}>🐾</span><h2>{dogName || 'Your good dog'}</h2><form className={s.form} onSubmit={saveProfile}><label>{'Their name'}<input value={dogName} onChange={e => setDogName(e.target.value)} maxLength={40} placeholder="Charlie" /></label><label>{'Breed / a lovely mix'}<input value={breed} onChange={e => setBreed(e.target.value)} maxLength={60} placeholder={'Tell us a little about them'} /></label><button disabled={busy} className={s.outlineButton}>{'Save their profile'}</button></form><p className={s.hint}>{'Only the dog’s name and the caption appear with a shared photo. Your email and account name are never shown in the gallery.'}</p><Link href="/#happy-tails">{'Visit the public gallery →'}</Link></aside>
 <section className={s.uploadCard}><p className="eyebrow">{'Make a little memory'}</p><h2>{'That tail-wagging'} <em>{'moment.'}</em></h2><form className={s.form} onSubmit={upload}><label className={s.upload}>{preview ? <img src={preview} alt={'Your selected photo'} /> : <span><b>＋</b>{'Choose their photo'}<small>JPG · PNG · WebP · 8 MB</small></span>}<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
                    setError('Choose a JPG, PNG or WebP photo under 8 MB.');
                    e.target.value = '';
                    setFile(null);
                    return;
                  }
                  setError('');
                  setFile(f);
                }} /></label><label>{'Their name'}<input value={dogName} onChange={e => setDogName(e.target.value)} required maxLength={40} /></label><label>{'A little story'}<textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={240} rows={3} required placeholder={'What made their tail wag today?'} /></label><label className={s.consent}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{consentCopy[lang]}</span></label><button className="button button-dark" disabled={busy || !file}>{busy ? 'Saving…' : consent ? 'Save & share this moment →' : 'Save privately →'}</button></form></section></div>
 <section className={s.album}><div><p className="eyebrow">{'Your little collection'}</p><h2>{'Their photo'} <em>{'album.'}</em></h2><p>{'Share a moment, keep it private or withdraw permission whenever you like.'}</p></div>{photos.length ? <div className={s.photoGrid}>{photos.map(photo => <article key={photo.id}><img src={`/api/community/photos/${photo.id}`} alt={photo.caption} loading="lazy" /><div className={s.photoBody}><span className={photo.consent ? s.publicBadge : s.privateBadge}>{photo.consent ? 'Shared in the gallery' : 'Only you'}</span><h3>{photo.dog_name}</h3><p>{photo.caption}</p><div className={s.photoActions}><button disabled={busy} onClick={() => {
                    if (photo.consent) sharing(photo.id, false);else {
                      setShareId(photo.id);
                      setShareConsent(false);
                    }
                  }}>{photo.consent ? 'Withdraw permission' : 'Share in the gallery'}</button><button disabled={busy} onClick={() => setDeleteId(photo.id)}>{'Delete'}</button></div>
 {shareId === photo.id && <div className={s.permissionBox}><label className={s.consent}><input type="checkbox" checked={shareConsent} onChange={e => setShareConsent(e.target.checked)} /><span>{consentCopy[lang]}</span></label><button className="button button-dark" disabled={!shareConsent || busy} onClick={() => sharing(photo.id, true)}>{'Give permission & share'}</button><button className={s.textButton} onClick={() => setShareId(null)}>{'Cancel'}</button></div>}
 {deleteId === photo.id && <div className={s.permissionBox}><p>{'Delete this photo from your album and the gallery?'}</p><button disabled={busy} className={s.outlineButton} onClick={() => remove(photo.id)}>{'Yes, delete photo'}</button><button className={s.textButton} onClick={() => setDeleteId(null)}>{'Keep it'}</button></div>}</div></article>)}</div> : <div className={s.empty}>{'Their first happy moment belongs here. Add a photo above.'}</div>}</section></>}
 {(error || status) && <div ref={feedback} tabIndex={-1} className={s.feedback}><div className={error ? s.error : s.success} role={error ? "alert" : "status"}>{error ? t(error) : status}<button type="button" onClick={() => {
            setError('');
            setStatus('');
          }} aria-label={'Dismiss message'}>×</button></div></div>}
 </main><SiteFooter /></>;
}
