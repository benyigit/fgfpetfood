'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from './language-provider';
import { usePageSection } from './site-content';
import { BlogCard } from './blog-card';
import { ContentMedia } from './content-media';
import { articleFromPublished, type BlogArticle } from '@/lib/blog';
import type { CMSPublished } from '@/lib/cms-types';
import styles from './blog.module.css';

export function JournalSection() {
  const { t } = useLanguage();
  const heading = usePageSection('home', 'journal');
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/content?kind=article', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.documents)) throw new Error('Unavailable');
      const all = (data.documents as CMSPublished[]).map(articleFromPublished);
      setArticles([...all.filter(article => article.featured), ...all.filter(article => !article.featured)].slice(0, 3));
    }).catch(error => { if (error.name !== 'AbortError') setError(true); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return <section id="journal" className="section-wrap journal-section">
    {heading && <div className="section-heading"><div><p className="eyebrow">{t('FGF blog')}</p><h2>{heading.title} <em>{heading.subtitle}</em></h2></div><div className="journal-heading-action"><p>{heading.body}</p></div></div>}
    {loading && <p role="status">Loading the latest stories…</p>}
    {error && <p role="status">Our stories are taking a little longer to load. <Link href="/blog">Visit the blog →</Link></p>}
    <div className={styles.grid}>{articles.map(article => <BlogCard key={article.id} article={article} />)}</div>
    {heading?.media[0] ? <div className="pdf-visual-banner"><ContentMedia media={heading.media[0]} />{heading.media[0].type === 'image' && <Link className="pdf-banner-cta" href="/blog">{t('Explore More Articles ')}<span aria-hidden="true">→</span></Link>}</div> : null}
    {heading?.media[0]?.type !== 'image' && <p><Link className="button button-dark" href="/blog">{t('Explore More Articles ')}<span aria-hidden="true">→</span></Link></p>}

  </section>;
}
