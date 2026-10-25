'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { BlogExplorer } from '@/components/blog-explorer';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { PageTrail } from '@/components/page-trail';
import { readingMinutes, storyCover, type BlogArticle } from '@/lib/blog';
import { ContentMedia } from '@/components/content-media';
import styles from '@/components/blog.module.css';
export default function BlogPage({ articles }: { articles: BlogArticle[] }) {
  const {
    t,
    language
  } = useLanguage();
  const featured = articles.find(article => article.featured) || articles[0];
  return <><SiteHeader current="blog" /><main className={styles.blogPage}>
    <PageTrail page="blog" />
    <section className={`${styles.masthead} section-wrap`} aria-labelledby="blog-title"><div><p className="eyebrow">FGF PET FOOD BLOG <span aria-hidden="true">✳</span></p><h1 id="blog-title">{'Good dogs.'} <em>{'Great reads.'}</em></h1></div><p>{'A cosy spot. Your favourite companion. A little something worth reading together.'}</p></section>
    {featured && <section className={`${styles.featured} section-wrap`} aria-labelledby="featured-title"><Link className={styles.featuredPhoto} href={`/blog/${featured.id}`} tabIndex={-1} aria-hidden="true"><ContentMedia media={{ ...storyCover(featured), alt: '' }} preview priority /><span className={styles.sticker}>PAWS<br />& READ</span></Link><div className={styles.featuredCopy}><p className={styles.featuredLabel}><span aria-hidden="true">✿</span> {'A good place to start'}</p><div className={styles.featuredMeta}><span>{t(featured.category)}</span><span>·</span><span>{readingMinutes(featured)} {'min read'}</span></div><h2 id="featured-title"><Link href={`/blog/${featured.id}`}>{featured.title}</Link></h2><p>{featured.excerpt}</p><Link href={`/blog/${featured.id}`} className="button button-dark">{'Settle in & read'} <span aria-hidden="true">↗</span></Link></div></section>}
    <BlogExplorer articles={articles} />
    <PageTrail page="blog" bottom />
  </main><SiteFooter /></>;
}
