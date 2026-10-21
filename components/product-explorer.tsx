'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from './language-provider';
import { useFavorites } from './favorites-provider';
import { localCatalog, money, type CatalogProduct } from '@/lib/catalog';
export function ProductExplorer({
  initialSearch = '',
  initialFavoritesOnly = false
}: {
  initialSearch?: string;
  initialFavoritesOnly?: boolean;
}) {
  const {
    t,
    language
  } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogProduct[]>(localCatalog);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(initialSearch);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [error, setError] = useState(false);
  const {
    favoriteIds,
    toggleFavorite
  } = useFavorites();
  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/storefront', {
      signal: ac.signal
    }).then(r => {
      if (!r.ok) throw Error();
      return r.json();
    }).then(d => setCatalog(d.products)).catch(e => {
      if (e.name !== 'AbortError') setError(true);
    });
    return () => ac.abort();
  }, []);
  useEffect(() => setSearch(initialSearch), [initialSearch]);
  useEffect(() => setFavoritesOnly(initialFavoritesOnly), [initialFavoritesOnly]);
  const visible = useMemo(() => catalog.filter(p => (filter === 'all' || p.group === filter) && (!favoritesOnly || favoriteIds.includes(p.id)) && `${p.name} ${p.description} ${t(p.name)} ${t(p.kind)}`.toLocaleLowerCase(language).includes(search.toLocaleLowerCase(language))), [catalog, filter, favoritesOnly, favoriteIds, search, language, t]);
  return <><div className="filter-row" role="group" aria-label={'Filter products'}>{[['all', 'All the chews'], ['beef', 'Beef'], ['poultry', 'Poultry'], ['lamb', 'Lamb'], ['collagen', 'Collagen']].map(([key, label]) => <button key={key} className={`filter-chip ${filter === key && !favoritesOnly ? 'is-active' : ''}`} type="button" onClick={() => {
        setFilter(key);
        setFavoritesOnly(false);
      }}>{t(label)}</button>)}<button type="button" className={`filter-chip ${favoritesOnly ? 'is-active' : ''}`} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(v => !v)}>♡ {t('Favorites')} ({favoriteIds.length})</button><label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Find a chew')} aria-label={t('Search treats')} /></label></div>
 {error && <p role="status" className="catalog-note">{'Live availability is temporarily unavailable. You can still explore the collection.'}</p>}
 <div className="product-grid enhanced-catalog" aria-live="polite">{visible.map(p => <article className="product-card" key={p.id}><div className="product-image-wrap"><Link className="catalog-image-link" href={`/shop/${p.id}`} aria-label={t(p.name)}><img className="catalog-pack" src={p.media[0]?.src} alt={`${t(p.name)} — ${'front of pack'}`} loading="lazy" />{p.media.find(m => m.origin === 'ai') && <img className="catalog-lifestyle" src={p.media.find(m => m.origin === 'ai')!.src} alt="" loading="lazy" />}</Link><span className="product-sticker">{t(p.kind)}</span><button className={`save-button ${favoriteIds.includes(p.id) ? 'is-saved' : ''}`} type="button" aria-label={`${t('Favorites')}: ${t(p.name)}`} aria-pressed={favoriteIds.includes(p.id)} onClick={() => toggleFavorite(p.id)}>{favoriteIds.includes(p.id) ? '♥' : '♡'}</button><span className="catalog-media-count">{p.media.length} {'views'}</span></div><div className="product-card-body"><span className="product-kind">QUIPAW · {p.details ? t(p.details.packSize) : t('Natural chews')}</span><h3><Link href={`/shop/${p.id}`}>{t(p.name)}</Link></h3><p>{p.details?.tagline['en'] || t(p.description)}</p>{p.variants[0] && <strong className="catalog-price">{money(p.variants[0].price, language)}</strong>}<Link className="card-action" href={`/shop/${p.id}`}>{'Meet this chew'} <span aria-hidden="true">↗</span></Link></div></article>)}</div>
 {!visible.length && <p className="empty-state">{'No chews found. Try another search or save a favourite.'}</p>}</>;
}
