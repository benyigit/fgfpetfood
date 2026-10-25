'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language-provider';
import { SiteHeader, SiteFooter } from './site-shell';
import { useBag, findBagProduct, validPrice } from './commerce-provider';
import { money, type CatalogProduct, type Media } from '@/lib/catalog';
import styles from './catalog.module.css';
import bag from './bag.module.css';
function Zoom({
  item,
  name,
  close
}: {
  item: Media;
  name: string;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const {
    language
  } = useLanguage();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      d?.close();
      document.body.style.overflow = old;
    };
  }, []);
  return <dialog className={styles.zoom} ref={ref} onCancel={close} onClick={e => {
    if (e.target === e.currentTarget) close();
  }} aria-label={name}><button onClick={close} className={styles.close} aria-label={'Close'}>×</button><img src={item.src} alt={`${name} — ${item.label}`} /></dialog>;
}
export function ProductDetail({
  product: p,
  related
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const {
    t,
    language
  } = useLanguage();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(p.variants.find(v => v.availableForSale)?.id || p.variants[0]?.id || '');
  const [added, setAdded] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState(p);
  const [storeStatus, setStoreStatus] = useState<'loading' | 'ready' | 'offline' | 'error'>('loading');
  const [refresh, setRefresh] = useState(0);
  const [addError, setAddError] = useState('');
  const { add, hydrated } = useBag();

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let active = true;
    setStoreStatus('loading');
    fetch('/api/storefront', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.products) || typeof data.connected !== 'boolean') throw new Error('Shop unavailable');
      if (!active) return;
      const current = findBagProduct(data.products, p.id);
      setPurchaseProduct(current || { ...p, connected: false, variants: [] });
      setStoreStatus(data.connected ? 'ready' : 'offline');
      setVariantId(selected => selected || current?.variants.find(v => v.availableForSale)?.id || current?.variants[0]?.id || '');
    }).catch(() => { if (active) setStoreStatus('error'); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [p, refresh]);

  useEffect(() => {
    const onFocus = () => setRefresh(value => value + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  const d = p.details;
  const item = p.media[index];
  const variant = purchaseProduct.variants.find(v => v.id === variantId);
  const lang = 'en';
  const loading = storeStatus === 'loading';
  const liveProduct = storeStatus === 'ready' && purchaseProduct.connected;
  const canAdd = hydrated && (liveProduct
    ? !!variant?.availableForSale && validPrice(variant.price)
    : storeStatus === 'offline' || (storeStatus === 'ready' && !purchaseProduct.connected));
  const purchaseNote = loading ? 'Checking the latest price and availability…'
    : storeStatus === 'error' ? 'We could not check this pack right now. Please try again.'
    : !liveProduct ? 'Save this treat for later. It is not available for online ordering yet.'
    : !variant ? 'Please choose an available pack to continue.'
    : !variant.availableForSale ? 'This pack is currently sold out. You can choose another pack or check back soon.'
    : !validPrice(variant.price) ? 'The price for this pack is unavailable. Please try again.'
    : 'Shipping, taxes and any discounts are calculated at Shopify checkout.';
  const backIndex = p.media.findIndex(m => m.label === 'Back of pack');
  return <><SiteHeader /><main className={styles.detail}>
    <nav className={`${styles.crumb} section-wrap`} aria-label={'Breadcrumb'}><Link href="/shop">{'The shop'}</Link><span>/</span><span>{t(p.name)}</span></nav>
    <section className={`${styles.productHero} section-wrap`}>
      <div className={styles.gallery}>
        <div className={styles.stage}>
          {item?.type === 'video' ? <video key={item.src} controls playsInline preload="metadata" poster={item.poster}><source src={item.src} type="video/mp4" /></video> : item ? <button className={styles.photoButton} onClick={() => setZoom(true)} aria-label={'Enlarge product image'}><img src={item.src} alt={`${t(p.name)} — ${t(item.label)}`} className={item.origin === 'original' ? styles.packPhoto : styles.scenePhoto} /><span className={styles.zoomHint}>↗ {'Take a closer look'}</span></button> : null}
          <span className={styles.count}>{index + 1} / {p.media.length}</span>
        </div>
        <div className={styles.thumbnails} aria-label={'Product gallery'}>{p.media.map((m, i) => <button key={m.src} onClick={() => setIndex(i)} aria-pressed={i === index} aria-label={`${t(m.label)} ${i + 1}`}><img src={m.type === 'video' ? m.poster : m.src} alt="" loading="lazy" />{m.type === 'video' && <span className={styles.videoThumbnail} aria-hidden="true">▶</span>}</button>)}</div>
        <p className={styles.caption}>{item?.origin === 'ai' ? 'AI-created lifestyle scene. See the original pack photos for the actual product.' : item?.type === 'video' ? 'From the brand’s video collection.' : 'Explore the pack, the details and a little treat-time inspiration.'}</p>
      </div>
      <div className={styles.productInfo}><p className="eyebrow">QUIPAW · {t(p.kind)}</p><h1>{t(p.name)}</h1>{d && <p className={styles.tagline}>{d.tagline[lang]}</p>}<p className={styles.overview}>{d?.overview[lang] || p.description}</p>
        {d && <><div className={styles.seals}><span>✿ {'100% natural'}</span><span>1 {'Single ingredient'}</span><span>♡ {'No artificial flavors'}</span></div><dl className={styles.quickFacts}><div><dt>{'Inside the pack'}</dt><dd>{t(d.packSize)}</dd></div><div><dt>{'Origin'}</dt><dd>{d.origin}</dd></div></dl></>}
        <div className={styles.purchase} aria-busy={loading}>
          {liveProduct && variant && validPrice(variant.price) && <><strong className={styles.price}>{money(variant.price, language)}</strong><small className={bag.productPriceNote}>{t('Price per pack')}</small><span className={bag.productStock} data-available={variant.availableForSale}>{t(variant.availableForSale ? 'Available to order' : 'Sold out')}</span></>}
          {(purchaseProduct.variants.length > 1 || (purchaseProduct.variants.length > 0 && !variant)) && <label>{t('Choose a pack')}<select value={variantId} disabled={loading} onChange={event => {
            setVariantId(event.target.value); setAdded(false); setAddError('');
          }}>{!variant && <option value={variantId} disabled>{t('Choose an available pack')}</option>}{purchaseProduct.variants.map(v => <option key={v.id} value={v.id}>{v.title}{v.availableForSale ? '' : ` · ${t('Sold out')}`}</option>)}</select></label>}
          <div className={styles.buyRow}><label className={styles.quantity}><span className={styles.srOnly}>{t('Quantity')}</span><button type="button" disabled={quantity <= 1} onClick={() => { setQuantity(value => Math.max(1, value - 1)); setAdded(false); }} aria-label={t('Decrease quantity')}>−</button><output>{quantity}</output><button type="button" disabled={quantity >= 20} onClick={() => { setQuantity(value => Math.min(20, value + 1)); setAdded(false); }} aria-label={t('Increase quantity')}>+</button></label><button className="button button-dark" disabled={!canAdd} onClick={() => {
            if (!canAdd) return;
            const saved = add(purchaseProduct, liveProduct ? variant : undefined, quantity);
            setAdded(saved);
            setAddError(saved ? '' : 'Your bag could not be updated. Please review your bag and try again.');
          }}>{t(loading ? 'Checking availability…' : storeStatus === 'error' ? 'Temporarily unavailable' : liveProduct && !canAdd ? (variant && !variant.availableForSale ? 'Sold out' : 'Choose a pack') : added ? 'Added to your bag ✓' : liveProduct ? 'Add to treat bag' : 'Save to treat bag')} <span aria-hidden="true">↗</span></button></div>
          <p className={bag.productStatus} data-error={storeStatus === 'error'} role="status">{t(purchaseNote)} {storeStatus === 'error' && <button className={bag.productRetry} type="button" onClick={() => setRefresh(value => value + 1)}>{t('Try again')} ↻</button>}</p>
          {addError && <p className={bag.productStatus} data-error="true" role="alert">{t(addError)}</p>}
          {added && <div className={bag.productAdded} role="status"><span>{t('A little more joy in their bag.')}</span><Link href="/cart">{t('View treat bag')} →</Link></div>}
        </div>
        <a className={styles.question} href="tel:+12813010010">{'A question about this chew?'} <strong>281-301-0010 ↗</strong></a>
      </div>
    </section>
    {d && <><section className={`${styles.story} section-wrap`}><div className={styles.storyIntro}><p className="eyebrow">{'A closer sniff'}</p><h2>{'Little details.'} <em>{'Lots to love.'}</em></h2></div><div className={styles.highlights}>{d.highlights.map((h, i) => <article key={h.title.en}><span className={styles.featureNumber}>0{i + 1}</span><h3>{h.title[lang]}</h3><p>{h.body[lang]}</p></article>)}</div></section>
    <section className={`${styles.infoGrid} section-wrap`}><div className={styles.nutrition}><p className="eyebrow">{'Straight from the pack'}</p><h2>{'What’s inside?'}</h2><p><strong>{'Ingredients'}: </strong>{t(d.ingredients)}</p><table><caption>{'Guaranteed analysis'}</caption><tbody>{['Crude protein (min.)', 'Crude fat (min.)', 'Crude ash (max.)', 'Moisture (max.)'].map((label, i) => <tr key={label}><th scope="row">{t(label)}</th><td>{d.analysis[i].toFixed(2)}%</td></tr>)}</tbody></table><p className={styles.caption}>{'Transcribed from the photographed package label. Check the pack you receive for current batch information.'}</p>{backIndex >= 0 && <button className={styles.bagLink} onClick={() => {
              setIndex(backIndex);
              setZoom(true);
            }}>{'Read the back of the pack ↗'}</button>}</div>
    <div className={styles.accordions}><details open><summary>{'Make chew time a happy time'}</summary><p>{'Choose a piece suited to your dog’s size and chewing habits. Always supervise, offer fresh water and remove pieces small enough to swallow whole. Introduce new treats gradually.'}</p><p>{'Offer as a treat alongside a complete, balanced diet. Chewing time varies from dog to dog.'}</p></details><details><summary>{'Storage & natural variation'}</summary><p>{'Store in a cool, dry place. Natural chews vary in shape, colour, size and texture. Keep the original packaging for the ingredient and batch information.'}</p></details><details><summary>{'Pack details'}</summary><dl><dt>{'Pack size'}</dt><dd>{t(d.packSize)}</dd><dt>{'Country of origin'}</dt><dd>{d.origin}</dd><dt>{'Barcode'}</dt><dd>{d.barcode}</dd><dt>{'Distributed by'}</dt><dd>FGF PET FOOD BAZAAR LLC<br />The Woodlands, TX 77382, USA</dd></dl></details></div></section></>}
    <section className={`${styles.related} section-wrap`}><p className="eyebrow">{'Keep the good things coming'}</p><h2>{'Another little'} <em>{'favourite.'}</em></h2><div>{related.slice(0, 3).map(r => <Link key={r.id} href={`/shop/${r.id}`}><img src={r.media[0]?.src} alt={t(r.name)} loading="lazy" /><span>{t(r.name)} <b>↗</b></span></Link>)}</div></section>
    {zoom && item && <Zoom item={item} name={t(p.name)} close={() => setZoom(false)} />}
  </main><SiteFooter /></>;
}
