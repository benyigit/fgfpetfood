'use client';

import Link from 'next/link';
import { useBag } from './commerce-provider';
import { useLanguage } from './language-provider';
export function MemberTools() {
  const {
    lines
  } = useBag();
  const {
    language
  } = useLanguage();
  return <div className="member-tools"><Link href="/account" aria-label={'My account and photos'} title={'My account'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></svg></Link><Link href="/cart" aria-label={`${'Treat bag'}: ${lines.reduce((n, l) => n + l.quantity, 0)}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></svg><span>{lines.reduce((n, l) => n + l.quantity, 0)}</span></Link></div>;
}
