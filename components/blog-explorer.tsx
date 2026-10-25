'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from './language-provider';
import { BlogCard } from './blog-card';
import type { BlogArticle } from '@/lib/blog';
import styles from './blog.module.css';
const savedFilters = 'fgf-blog-filters';
export function BlogExplorer({ articles }: { articles: BlogArticle[] }) {
  const {
    t,
    language
  } = useLanguage();
  const [category, setCategory] = useState('All stories');
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);
  const categories = ['All stories', ...new Set(articles.map(article => article.category))];
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(savedFilters) || 'null');
      if (saved && typeof saved.search === 'string') setSearch(saved.search);
      if (saved && articles.some(article => article.category === saved.category)) setCategory(saved.category);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try {
      sessionStorage.setItem(savedFilters, JSON.stringify({
        category,
        search
      }));
    } catch {}
  }, [category, search, ready]);
  const visible = useMemo(() => articles.filter(article => (category === 'All stories' || article.category === category) && `${article.title} ${article.excerpt} ${article.body.join(' ')}`.toLocaleLowerCase('en').includes(search.trim().toLocaleLowerCase('en'))), [articles, category, search, language]);
  return <section className={`${styles.library} section-wrap`} id="all-stories" aria-labelledby="blog-library-title">
    <div className={styles.libraryHeading}><div><p className="eyebrow">{'For curious noses & their humans'}</p><h2 id="blog-library-title">{'A little discovery.'}<br /><em>{'A lot of happy.'}</em></h2></div><p>{'Get to know their chews, discover a different texture and find a little inspiration for treat time.'}</p></div>
    <div className={styles.controls}><div className={styles.filters} role="group" aria-label={'Blog categories'}>{categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{t(item)}</button>)}</div><label className={styles.search}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={'Find a little read…'} aria-label={'Search blog posts'} /></label></div>
    <div className={styles.resultLine}><span aria-live="polite">{visible.length} {visible.length === 1 ? 'story to explore' : 'stories to explore'}</span>{(category !== 'All stories' || search) && <button onClick={() => {
        setSearch('');
        setCategory('All stories');
      }}>{'Clear filters'} ×</button>}</div>
    <div className={styles.grid}>{visible.map(article => <BlogCard key={article.id} article={article} />)}</div>
    {visible.length === 0 && <div className={styles.empty}><span aria-hidden="true">✿</span><h3>{'No stories on this trail.'}</h3><p>{'Try a different word, or take a look at all our stories.'}</p><button className="button button-dark" onClick={() => {
        setSearch('');
        setCategory('All stories');
      }}>{'Show all stories'} →</button></div>}
    <aside className={styles.communityCallout}><div><p className="eyebrow">{'More good days, together'}</p><h2>{'Take a little paws from reading.'}</h2><p>{'Discover the dog-friendly days we’re dreaming up for the FGF community.'}</p></div><Link className="button button-dark" href="/events">{'Explore good times'} <span aria-hidden="true">↗</span></Link><span className={styles.calloutFlower} aria-hidden="true">✿</span></aside>
  </section>;
}
