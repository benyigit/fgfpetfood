'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { BlogExplorer } from '@/components/blog-explorer';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { PageTrail } from '@/components/page-trail';
import { getArticles, readingMinutes, storyCover } from '@/lib/blog';
import styles from '@/components/blog.module.css';
export default function BlogPage() {
  const {
    t,
    language
  } = useLanguage();
  const featured = getArticles(language)[0];
  return <><SiteHeader current="blog" /><main className={styles.blogPage}>
    <PageTrail page="blog" />
    <section className={`${styles.masthead} section-wrap`} aria-labelledby="blog-title"><div><p className="eyebrow">FGF PET FOOD BLOG <span aria-hidden="true">✳</span></p><h1 id="blog-title">{'Good dogs.'} <em>{'Great reads.'}</em></h1></div><p>{'A cosy spot. Your favourite companion. A little something worth reading together.'}</p></section>
    <section className={`${styles.featured} section-wrap`} aria-labelledby="featured-title"><Link className={styles.featuredPhoto} href={`/blog/${featured.id}`} tabIndex={-1} aria-hidden="true"><img src={storyCover(featured).src} alt="" fetchPriority="high" /><span className={styles.sticker}>PAWS<br />& READ</span></Link><div className={styles.featuredCopy}><p className={styles.featuredLabel}><span aria-hidden="true">✿</span> {'A good place to start'}</p><div className={styles.featuredMeta}><span>{t(featured.category)}</span><span>·</span><span>{readingMinutes(featured)} {'min read'}</span></div><h2 id="featured-title"><Link href={`/blog/${featured.id}`}>{featured.title}</Link></h2><p>{featured.excerpt}</p><Link href={`/blog/${featured.id}`} className="button button-dark">{'Settle in & read'} <span aria-hidden="true">↗</span></Link></div></section>
    <BlogExplorer />
    <PageTrail page="blog" bottom />
  </main><SiteFooter /></>;
}
