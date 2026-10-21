'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useBag, lineKey } from './commerce-provider';
import { useLanguage } from './language-provider';
import { SiteHeader, SiteFooter } from './site-shell';
import { money, type CatalogProduct } from '@/lib/catalog';
import s from './member.module.css';
export function BagPage() {
  const {
    lines,
    change
  } = useBag();
  const {
    language,
    t
  } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState<CatalogProduct[] | null>(null);
  useEffect(() => {
    fetch('/api/storefront').then(r => r.json()).then(d => {
      if (d.connected) setLive(d.products);
    }).catch(() => {});
  }, []);
  const resolved = lines.map(line => {
    const p = live?.find(p => p.id === line.productId);
    const v = line.variantId ? p?.variants.find(v => v.id === line.variantId) : p?.variants.length === 1 ? p.variants[0] : undefined;
    return {
      line,
      p,
      v
    };
  });
  const ready = lines.length > 0 && resolved.every(r => r.v?.availableForSale);
  const currency = resolved[0]?.v?.price.currencyCode;
  const sameCurrency = resolved.every(r => r.v?.price.currencyCode === currency);
  async function pay() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lines: resolved.map(r => ({
            merchandiseId: r.v!.id,
            quantity: r.line.quantity
          }))
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.assign(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      setBusy(false);
    }
  }
  return <><SiteHeader /><main className={`${s.page} section-wrap`}><p className="eyebrow">{'Saved for a happy day'}</p><h1>{'Their treat'} <em>{'bag.'}</em></h1>{lines.length ? <div className={s.bagLayout}><div className={s.bagItems}>{resolved.map(({
            line,
            v,
            p
          }) => <article key={lineKey(line)}><Link href={`/shop/${line.productId}`}><img src={line.image} alt={t(line.name)} /></Link><div><Link href={`/shop/${line.productId}`}><h3>{t(line.name)}</h3></Link>{line.variantTitle && line.variantTitle !== 'Default Title' && <small>{line.variantTitle}</small>}<p>{v ? money(v.price, language) : 'Price available when ordering opens'}</p>{live && !v && <p><Link href={`/shop/${p?.id || line.productId}`}>{'Choose an available pack →'}</Link></p>}<label>{'Quantity'} <select value={line.quantity} onChange={e => change(lineKey(line), Number(e.target.value))}>{Array.from({
                    length: 20
                  }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label><button className={s.textButton} onClick={() => change(lineKey(line), 0)}>{'Remove'}</button></div></article>)}</div><aside className={s.bagSummary}><span className={s.bigPaw}>♡</span><h2>{'A little bag of joy.'}</h2><p>{lines.reduce((n, l) => n + l.quantity, 0)} {'packs in your bag'}</p>{ready && sameCurrency && currency && <strong className={s.total}>{money({
              amount: String(resolved.reduce((n, r) => n + Number(r.v!.price.amount) * r.line.quantity, 0)),
              currencyCode: currency
            }, language)}</strong>}<button className="button button-dark" disabled={!ready || busy} onClick={pay}>{busy ? 'Opening checkout…' : 'Continue to checkout →'}</button><p className={s.hint}>{ready ? 'Payment, delivery and final totals are handled securely by Shopify.' : 'Online ordering is coming soon. Your picks are saved here on this device.'}</p>{error && <p role="alert" className={s.error}>{error}</p>}<Link href="/shop">{'Keep exploring'}</Link></aside></div> : <div className={s.empty}><span className={s.bigPaw}>♡</span><h2>{'A little room for good things.'}</h2><p>{'Find a chew they will love and add it to their bag.'}</p><Link className="button button-dark" href="/shop">{'Explore the chews →'}</Link></div>}</main><SiteFooter /></>;
}
