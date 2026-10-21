'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from './language-provider';
import s from './member.module.css';
type Photo = {
  id: string;
  dog_name: string;
  caption: string;
};
export function CommunityFeed() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const {
    language
  } = useLanguage();
  useEffect(() => {
    let alive = true;
    const refresh = () => fetch('/api/community/feed', {
      cache: 'no-store'
    }).then(r => r.ok ? r.json() : {
      photos: []
    }).then(d => {
      if (alive) setPhotos(d.photos);
    }).catch(() => {});
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('community:updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      alive = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('community:updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  if (!photos.length) return null;
  return <div className={s.community}><div><p className="eyebrow">{'From our community'}</p><h3>{'Happy moments, shared with permission.'}</h3><Link href="/account">{'Add your happy moment →'}</Link></div><div className={s.photoGrid}>{photos.map(p => <article key={p.id}><img src={`/api/community/photos/${p.id}`} alt={p.caption} loading="lazy" /><div className={s.photoBody}><h3>{p.dog_name}</h3><p>{p.caption}</p></div></article>)}</div></div>;
}
