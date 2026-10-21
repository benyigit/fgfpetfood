'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language-provider';
import { SiteFooter, SiteHeader } from './site-shell';
import { PageTrail } from './page-trail';
import { BlogCard } from './blog-card';
import { readingMinutes, storyCover, storySections, type BlogArticle } from '@/lib/blog';
import styles from './blog.module.css';
type Props = {
  article: {
    en: BlogArticle;
  };
  related: {
    en: BlogArticle[];
  };
  product?: {
    id: string;
    name: string;
    image: string;
  };
};
export function BlogReader({
  article,
  related,
  product
}: Props) {
  const {
    language,
    setLanguage,
    t
  } = useLanguage();
  const post = article[language];
  const sections = storySections(post, language);
  const cover = storyCover(post);
  const content = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(sections[0]?.id);
  const [shareMessage, setShareMessage] = useState('');
  const [copyUrl, setCopyUrl] = useState('');
  useEffect(() => {
    document.title = `${post.title} — FGF Pet Food Blog`;
  }, [post.title]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = content.current?.getBoundingClientRect();
      if (!rect) return;
      const distance = Math.max(1, rect.height - window.innerHeight + 160);
      setProgress(Math.round(Math.max(0, Math.min(1, (120 - rect.top) / distance)) * 100));
      const visible = Array.from(content.current!.querySelectorAll<HTMLElement>('[data-story-section]'));
      setActive(visible.filter(element => element.getBoundingClientRect().top <= 180).at(-1)?.id || visible[0]?.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, {
      passive: true
    });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [language, post.id]);
  async function share() {
    const url = `${window.location.origin}/blog/${post.id}`;
    setShareMessage('');
    setCopyUrl('');
    try {
      if (navigator.share && navigator.maxTouchPoints > 0) {
        await navigator.share({
          title: post.title,
          url
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMessage('Story link copied.');
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setCopyUrl(url);
      setShareMessage('Select and copy the link below.');
    }
  }
  const contents = <ol>{sections.map(section => <li key={section.id}><a href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined}>{section.title.replace(/^\d+\.\s/, '')}</a></li>)}</ol>;
  return <><SiteHeader current="blog" /><main className={styles.reader}>
    <div className={styles.progress} aria-hidden="true"><span style={{
          width: `${progress}%`
        }} /></div>
    <PageTrail page="blog" article />
    <header className={`${styles.storyHeader} section-wrap`}><div className={styles.storyMeta}><span className={styles.category}>{t(post.category)}</span><span>{readingMinutes(post)} {'min read'}</span><span aria-hidden="true">✳</span><span>FGF PET FOOD BLOG</span></div><h1>{post.title}</h1><p>{'A little reading for the good moments you share with your dog.'}</p><button className={styles.shareButton} onClick={share}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>{'Share this story'}</button><span className={styles.shareStatus} role="status">{shareMessage}</span>{copyUrl && <input className={styles.copyField} readOnly value={copyUrl} onFocus={event => event.target.select()} aria-label={'Story URL'} />}</header>
    <figure className={`${styles.cover} section-wrap`}><img src={cover.src} alt={'A dog enjoying a little Quipaw treat-time moment'} fetchPriority="high" /><span className={styles.coverSticker}>GOOD DOG<br />READING CLUB</span><figcaption>{cover.ai ? 'An AI-created lifestyle scene.' : 'From the FGF story collection.'}</figcaption></figure>
    <div className={`${styles.readingLayout} section-wrap`}>
      <aside className={styles.sidebar}><nav className={styles.contents} aria-label={'In this story'}><p><span aria-hidden="true">✷</span> {'In this story'}</p>{contents}</nav>{product && <Link href={`/shop/${product.id}`} className={styles.productNote}><img src={product.image} alt={t(product.name)} loading="lazy" /><span>{'Meet the chew'}<strong>{t(product.name)}</strong><small>{'Explore the product'} ↗</small></span></Link>}</aside>
      <article className={styles.readingContent} aria-label={post.title}>
        <details className={styles.mobileContents}><summary>{'What’s in this story?'}</summary><nav aria-label={'Contents'}>{contents}</nav></details>

        <div ref={content}>{sections.map((section, sectionIndex) => <section id={section.id} key={section.id} className={styles.textSection} data-story-section>
          {section.id !== 'introduction' && <h2>{section.title}</h2>}
          {section.blocks.map((block, index) => block.type === 'table' ? <div key={index} className={styles.tableScroll} tabIndex={0} role="region" aria-label={section.title}><table><caption>{'The details, at a glance'}</caption><thead><tr>{block.headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div> : <p className={sectionIndex === 0 && index === 0 ? styles.lead : block.text.startsWith('*') ? styles.footnote : undefined} key={index}>{block.text}</p>)}
        </section>)}</div>
        <div className={styles.storyEnd}><span aria-hidden="true">✿</span><p>{'A good read. Now for a good little moment.'}</p><Link className="button button-dark" href="/blog#all-stories">{'Back to more good reads'} <span aria-hidden="true">→</span></Link>{product && <Link className={styles.endProduct} href={`/shop/${product.id}`}>{'Get to know this chew'} ↗</Link>}</div>
      </article>
    </div>
    <section className={`${styles.related} section-wrap`} aria-labelledby="related-stories"><div className={styles.libraryHeading}><div><p className="eyebrow">{'Another little page-turner'}</p><h2 id="related-stories">{'Keep the good reads'} <em>{'coming.'}</em></h2></div><Link className={styles.readLink} href="/blog#all-stories">{'All stories'} →</Link></div><div className={styles.grid}>{related[language].map(item => <BlogCard key={item.id} article={item} />)}</div></section>
    <PageTrail page="blog" article bottom />
  </main><SiteFooter /></>;
}
