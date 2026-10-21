'use client';

import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { useLanguage } from '@/components/language-provider';
import { PageTrail } from '@/components/page-trail';
import styles from '@/components/blog.module.css';
export default function StoryNotFound() {
  const {
    language
  } = useLanguage();
  return <><SiteHeader current="blog" /><main><PageTrail page="blog" article /><section className={`${styles.empty} section-wrap`}><span aria-hidden="true">✿</span><h1>{'This story wandered off.'}</h1><p>{'There are plenty more good reads waiting in the blog.'}</p><Link className="button button-dark" href="/blog">{'Back to the blog'} →</Link></section></main><SiteFooter /></>;
}
