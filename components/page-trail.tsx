'use client';

import Link from 'next/link';
import { useLanguage } from './language-provider';
import styles from './page-trail.module.css';
export function PageTrail({
  page,
  article = false,
  bottom = false
}: {
  page: 'blog' | 'events';
  article?: boolean;
  bottom?: boolean;
}) {
  const {
    language
  } = useLanguage();
  const backHref = article ? '/blog#all-stories' : page === 'blog' ? '/#journal' : '/#community';
  return <nav className={`${styles.trail} section-wrap ${bottom ? styles.bottom : ''}`} aria-label={'Back navigation and breadcrumbs'}>
    <Link href={backHref} className={styles.back}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18" /></svg>{article ? 'Back to all posts' : 'Back to home'}</Link>
    <ol><li><Link href="/">{'Home'}</Link></li><li aria-hidden="true">/</li><li>{article ? <Link href="/blog">Blog</Link> : <span aria-current="page">{page === 'blog' ? 'Blog' : 'Events'}</span>}</li>{article && <><li aria-hidden="true">/</li><li><span aria-current="page">{'The story'}</span></li></>}</ol>
  </nav>;
}
