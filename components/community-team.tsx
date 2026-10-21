'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from './site-shell';
import s from './member.module.css';
type Photo = { id: string; dog_name: string; caption: string; title: string; category: string; consent: number; social_consent: number; hidden: number };
type Withdrawal = { photo_id: string; created_at: number };
export function CommunityTeam() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch('/api/community/team', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Please try again.');
    setPhotos(data.photos);
    setWithdrawals(data.withdrawals);
  }
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function hide(photo: Photo) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/community/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: photo.id, hidden: !photo.hidden }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      await load();
      window.dispatchEvent(new Event('community:updated'));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <><SiteHeader /><main className={`${s.page} section-wrap`}><Link href="/account" className={s.teamBack}>← Back to your account</Link><p className="eyebrow">For the brand team</p><h1>Happy moments.<br /><em>Clear permissions.</em></h1><div className={s.teamIntro}><p>Website and social media permissions are separate. Download for social use only when the social permission badge is active. Check this page again before posting. You may hide a website photo, but only its owner can give sharing permission.</p></div>{error && <p role="alert" className={s.error}>{error}</p>}{loading ? <p role="status">Loading permissions…</p> : !error && <><div className={s.photoGrid}>{photos.map(photo => <article key={photo.id}><img src={`/api/community/photos/${photo.id}`} alt={photo.caption} loading="lazy" /><div className={s.photoBody}><div className={s.badges}><span className={photo.consent ? s.publicBadge : s.privateBadge}>{photo.consent ? 'Website · allowed' : 'Website · not allowed'}</span><span className={photo.social_consent ? s.socialBadge : s.privateBadge}>{photo.social_consent ? 'Social · allowed' : 'Social · not allowed'}</span></div><h3>{photo.title || photo.dog_name}</h3>{photo.title && <small>{photo.dog_name}</small>}<p>{photo.caption}</p><small>Photo reference: {photo.id}</small><div className={s.photoActions}>{photo.social_consent === 1 && <a href={`/api/community/photos/${photo.id}`} download={`happy-tails-${photo.id}.webp`}>Download for social media ↗</a>}{photo.consent === 1 && <button disabled={busy} onClick={() => hide(photo)}>{photo.hidden ? 'Show in website gallery' : 'Hide from website gallery'}</button>}</div></div></article>)}</div>{!photos.length && <div className={s.empty}>Photos with sharing permission will appear here.</div>}<section className={s.teamWithdrawals}><h2>Social permission withdrawn</h2><p>Stop using these photos and remove earlier posts from the brand’s accounts. Match the reference below to the downloaded filename. Deleting a photo also withdraws permission.</p>{withdrawals.length ? <ul>{Array.from(new Map(withdrawals.map(w => [w.photo_id, w])).values()).map(w => <li key={w.photo_id}>{w.photo_id} · {new Date(w.created_at).toLocaleDateString('en-US')}</li>)}</ul> : <p>No withdrawals to action.</p>}</section></>}</main><SiteFooter /></>;
}
