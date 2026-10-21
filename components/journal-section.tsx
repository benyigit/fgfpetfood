'use client';

import Link from 'next/link';
import { useLanguage } from './language-provider';
import { BlogCard } from './blog-card';
import { getArticles } from '@/lib/blog';
import styles from './blog.module.css';
export function JournalSection() {
  const {
    language,
    t
  } = useLanguage();
  const ids = ['bully-stick-6', 'chicken-feet', 'cow-ear-natural'];
  const articles = getArticles(language);
  return <section id="journal" className="section-wrap journal-section">
    <div className="section-heading"><div><p className="eyebrow">{t('FGF blog')}</p><h2>{t('Stories for ')}<em>{t('good dog days.')}</em></h2></div><Link className="text-link" href="/blog">{t('All blog stories')} <span aria-hidden="true">↗</span></Link></div>
    <Link className="pdf-visual-banner" href="/blog" aria-label={t('Browse FGF blog stories')}><img src="/assets/fgf-pdf-journal.webp" alt={t('A golden retriever at a laptop beside the hand-lettered Our Blog banner')} /></Link>
    <div className={styles.grid} id="journal-grid">{ids.map(id => {
        const article = articles.find(item => item.id === id);
        return article ? <BlogCard key={id} article={article} /> : null;
      })}</div>
  </section>;
}
