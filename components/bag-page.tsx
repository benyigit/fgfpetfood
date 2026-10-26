'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useBag, lineKey, resolveBagLines, validPrice, type BagLine } from './commerce-provider';
import { useLanguage } from './language-provider';
import { SiteHeader, SiteFooter } from './site-shell';
import { money, type CatalogProduct } from '@/lib/catalog';
import s from './member.module.css';
import bag from './bag.module.css';

type Storefront = { connected: boolean; products: CatalogProduct[] };
type Status = 'loading' | 'ready' | 'offline' | 'error';

async function readStorefront(signal: AbortSignal): Promise<Storefront> {
  const response = await fetch('/api/storefront', { cache: 'no-store', signal });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data.products) || typeof data.connected !== 'boolean') {
    throw new Error('We could not check the latest prices and availability. Please try again.');
  }
  return data;
}

function checkoutReady(rows: ReturnType<typeof resolveBagLines>) {
  const currency = rows[0]?.variant?.price.currencyCode;
  return rows.length > 0 && rows.every(({ line, variant }) => !!variant?.availableForSale
    && validPrice(variant.price) && variant.price.currencyCode === currency
    && /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variant.id)
    && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 20);
}

function priceSnapshot(lines: BagLine[], products: CatalogProduct[]) {
  return JSON.stringify(resolveBagLines(lines, products).map(({ line, variant }) => ({
    id: variant?.id, quantity: line.quantity, amount: variant?.price.amount,
    currency: variant?.price.currencyCode, available: variant?.availableForSale,
  })));
}

export function BagPage() {
  const { lines, hydrated, change, reconcile } = useBag();
  const { language, t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [live, setLive] = useState<CatalogProduct[]>([]);
  const [refresh, setRefresh] = useState(0);
  const paying = useRef(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let active = true;
    setStatus('loading');
    readStorefront(controller.signal).then(data => {
      if (!active) return;
      setLive(data.connected ? data.products : []);
      setStatus(data.connected ? 'ready' : 'offline');
    }).catch(() => {
      if (active) setStatus('error');
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [refresh]);

  useEffect(() => {
    if (hydrated && status === 'ready') reconcile(live);
  }, [hydrated, status, live, reconcile]);

  useEffect(() => {
    const onFocus = () => { if (!paying.current) setRefresh(value => value + 1); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const resolved = resolveBagLines(lines, live);
  const ready = hydrated && status === 'ready' && checkoutReady(resolved);
  const currency = resolved[0]?.variant?.price.currencyCode;
  const sameCurrency = !!currency && resolved.every(row => row.variant?.price.currencyCode === currency);
  const allPriced = resolved.length > 0 && resolved.every(row => validPrice(row.variant?.price));
  const showTotal = status === 'ready' && allPriced && sameCurrency;
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  async function pay() {
    if (!ready || paying.current) return;
    paying.current = true;
    setBusy(true);
    setError('');
    const startingLines = JSON.stringify(lines);
    let redirected = false;
    try {
      // Prices shown in the bag are refreshed again before creating a Shopify cart.
      const latest = await readStorefront(AbortSignal.timeout(20000));
      if (!latest.connected) {
        setStatus('offline');
        throw new Error('Online checkout is not available yet. Your picks are saved in your bag.');
      }
      if (startingLines !== JSON.stringify(linesRef.current)) {
        throw new Error('Your bag changed. Please review it before continuing.');
      }
      const freshRows = resolveBagLines(lines, latest.products);
      const changed = priceSnapshot(lines, live) !== priceSnapshot(lines, latest.products);
      setLive(latest.products);
      setStatus('ready');
      if (!checkoutReady(freshRows)) {
        throw new Error('A pack in your bag is no longer available. Please review the items below.');
      }
      if (changed) {
        throw new Error('A price or pack has changed. We have refreshed your bag; review the updated subtotal and continue when you are ready.');
      }
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ lines: freshRows.map(({ line, variant }) => ({
          merchandiseId: variant!.id, quantity: line.quantity,
        })) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRefresh(value => value + 1);
        throw new Error(typeof data.error === 'string' ? data.error : 'Checkout could not be opened. Please try again.');
      }
      if (Array.isArray(data.warnings) && data.warnings.length) {
        throw new Error('Shopify updated an item in your bag. Please review your quantities and try again.');
      }
      if (startingLines !== JSON.stringify(linesRef.current)) {
        throw new Error('Your bag changed. Please review it before continuing.');
      }
      if (typeof data.url !== 'string') throw new Error('Checkout could not be opened. Please try again.');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) {
        throw new Error('Checkout could not be opened. Please try again.');
      }
      window.location.assign(url.href);
      redirected = true;
    } catch (cause) {
      setError(cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')
        ? 'The shop took too long to respond. Please try again.'
        : cause instanceof TypeError || cause instanceof SyntaxError
          ? 'We could not reach the shop. Please check your connection and try again.'
          : cause instanceof Error ? cause.message : 'Checkout could not be opened. Please try again.');
    } finally {
      if (!redirected) { paying.current = false; setBusy(false); }
    }
  }

  const summaryNote = status === 'loading' ? 'Checking the latest prices and availability…'
    : status === 'error' ? 'We could not reach the shop. Your picks are saved; please try again.'
    : status === 'offline' ? 'Online checkout is not available yet. Your picks are saved in your bag.'
    : !sameCurrency && allPriced ? 'These packs use different currencies. Please update your bag before checkout.'
    : !ready ? 'Review the marked items to continue to checkout.'
    : 'Shipping, taxes and any discounts are calculated at Shopify checkout.';

  return <><SiteHeader /><main className={`${s.page} section-wrap`}>
    <Link className={bag.backLink} href="/shop">← {t('Back to the shop')}</Link>
    <p className="eyebrow">{t('Saved for a happy day')}</p><h1>{t('Their treat')} <em>{t('bag.')}</em></h1>
    {!hydrated ? <div className={bag.loading} role="status">{t('Opening your treat bag…')}</div> : lines.length ? <div className={bag.layout}>
      <div className={bag.items} aria-busy={busy}>
        <div className={bag.itemsHeading}><span>{count} {t(count === 1 ? 'pack picked with love' : 'packs picked with love')}</span><button type="button" onClick={() => { setError(''); setRefresh(value => value + 1); }} disabled={busy || status === 'loading'}>{t('Refresh prices')} ↻</button></div>
        {resolved.map(({ line, variant, product }) => {
          const issue = status !== 'ready' ? '' : !product ? 'This treat is no longer available in the shop.'
            : !product.connected ? 'This treat is not available for online ordering yet.'
            : product.priceReviewRequired ? 'This pack is awaiting price confirmation.'
            : !variant ? 'Please choose an available pack.'
            : !variant.availableForSale ? 'This pack is currently sold out.'
            : !validPrice(variant.price) ? 'The price for this pack is unavailable.' : '';
          const href = product?.connected ? `/shop/${encodeURIComponent(product.id)}` : status === 'ready' ? '/shop' : `/shop/${encodeURIComponent(line.productId)}`;
          return <article className={bag.item} key={lineKey(line)} data-unavailable={!!issue}>
            <Link className={bag.image} href={href}><img src={product?.media[0]?.src || line.image} alt={t(product?.name || line.name)} /></Link>
            <div className={bag.itemBody}>
              <Link href={href}><h2>{t(product?.name || line.name)}</h2></Link>
              {(variant?.title || line.variantTitle) && (variant?.title || line.variantTitle) !== 'Default Title' && <span className={bag.variant}>{variant?.title || line.variantTitle}</span>}
              <p className={bag.price}>{status === 'ready' && variant && validPrice(variant.price) ? money(variant.price, language) : status === 'loading' ? t('Checking price…') : product?.priceReviewRequired ? t('Price being confirmed') : t('Price currently unavailable')} {status === 'ready' && variant && validPrice(variant.price) && <small>{t('each')}</small>}</p>
              {issue && <p className={bag.itemIssue}>{t(issue)} <Link href={href}>{t(product?.priceReviewRequired ? 'View this treat →' : product?.connected ? 'Choose a pack →' : 'Explore the shop →')}</Link></p>}
              <div className={bag.itemActions}><label>{t('Quantity')} <select value={line.quantity} disabled={busy} aria-label={`${t('Quantity')} — ${t(line.name)}`} onChange={event => { change(lineKey(line), Number(event.target.value)); setError(''); }}>{Array.from({ length: 20 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><button type="button" onClick={() => { change(lineKey(line), 0); setError(''); }} disabled={busy} aria-label={`${t('Remove')} ${t(line.name)}`}>{t('Remove')}</button></div>
            </div>
            {status === 'ready' && variant && validPrice(variant.price) && <strong className={bag.lineTotal}>{money({ ...variant.price, amount: String(Number(variant.price.amount) * line.quantity) }, language)}</strong>}
          </article>;
        })}
      </div>
      <aside className={bag.summary} aria-label={t('Order summary')}>
        <span className={bag.heart} aria-hidden="true">♡</span><p className="eyebrow">{t('A little bag of joy')}</p><h2>{t('Good things await.')}</h2>
        <div className={bag.subtotal}><span>{t('Subtotal')}</span><strong>{showTotal && currency ? money({ amount: String(resolved.reduce((sum, row) => sum + Number(row.variant!.price.amount) * row.line.quantity, 0)), currencyCode: currency }, language) : '—'}</strong></div>
        <p className={bag.summaryNote} role="status">{t(summaryNote)}</p>
        <button className="button button-dark" type="button" disabled={!ready || busy} onClick={pay}>{t(busy ? 'Opening secure checkout…' : 'Checkout')} {!busy && <span aria-hidden="true">→</span>}</button>
        {(status === 'error' || status === 'offline') && <button className={bag.retry} type="button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>{t('Try again')} ↻</button>}
        {error && <p role="alert" className={bag.error}>{t(error)}</p>}
        <p className={bag.secure}><svg width="14" height="16" viewBox="0 0 16 18" fill="none" aria-hidden="true"><rect x="2" y="7" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 10.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{t('Secure checkout with Shopify')}</p>
        <Link className={bag.keepExploring} href="/shop">{t('Keep exploring')} →</Link>
      </aside>
    </div> : <div className={s.empty}><span className={s.bigPaw} aria-hidden="true">♡</span><h2>{t('A little room for good things.')}</h2><p>{t('Find a chew they will love and add it to their bag.')}</p><Link className="button button-dark" href="/shop">{t('Explore the chews →')}</Link></div>}
  </main><SiteFooter /></>;
}
