'use client';

import { useEffect, useState } from 'react';
import { money } from '@/lib/catalog';
import { PRICE_SNAPSHOT_MAX_AGE, validPriceSnapshot, type PriceSnapshot } from '@/lib/price-snapshot';
import styles from './catalog.module.css';
import bag from './bag.module.css';

/** A dated display price has no effect on cart totals or order availability. */
export function VerifiedProductPrice({ snapshot }: { snapshot: PriceSnapshot }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const now = Date.now();
    const valid = validPriceSnapshot(snapshot, now);
    setExpired(!valid);
    if (!valid) return;
    const remaining = Date.parse(snapshot.verifiedAt) + PRICE_SNAPSHOT_MAX_AGE - now;
    const timer = window.setTimeout(() => setExpired(true), remaining);
    return () => window.clearTimeout(timer);
  }, [snapshot]);
  if (expired) return null;
  const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(snapshot.verifiedAt));
  return <div className={styles.verifiedPrice}>
    <strong className={styles.price}>{money(snapshot)} <small className={styles.priceCurrency}>{snapshot.currencyCode}</small></strong>
    <small className={bag.productPriceNote}>Price checked <time dateTime={snapshot.verifiedAt}>{date}</time>{snapshot.variantTitle && snapshot.variantTitle !== 'Default Title' ? ` · ${snapshot.variantTitle}` : ''}</small>
  </div>;
}
