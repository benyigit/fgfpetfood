'use client';

import Link from 'next/link';
import { useLanguage } from './language-provider';
import { readingMinutes, storyCover, type BlogArticle } from '@/lib/blog';
import styles from './blog.module.css';
export function BlogCard({
  article
}: {
  article: BlogArticle;
}) {
  const {
    t,
    language
  } = useLanguage();
  const cover = storyCover(article);
  return <article className={styles.card}>
    <Link href={`/blog/${article.id}`} className={styles.cardPhoto} tabIndex={-1} aria-hidden="true"><img src={cover.src} alt="" loading="lazy" /><span className={styles.photoArrow}>↗</span>{cover.ai && <small className={styles.aiLabel}>{'AI-created scene'}</small>}</Link>
    <div className={styles.cardBody}><div className={styles.cardMeta}><span className={styles.category}>{t(article.category)}</span><span>{readingMinutes(article)} {'min read'}</span></div><h3><Link href={`/blog/${article.id}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className={styles.readLink} href={`/blog/${article.id}`}>{'Read the story'}<span aria-hidden="true">→</span></Link></div>
  </article>;
}
