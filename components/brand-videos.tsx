'use client';

import { useLanguage } from './language-provider';
import s from './member.module.css';
export function BrandVideos() {
  const {
    language
  } = useLanguage();
  const videos = [['happy-pups', 'Happy pups, real moments.'], ['golden-hour', 'A golden little reward.'], ['halloween', 'A little spooky. A lot of happy.']];
  return <div className={s.brandVideos}><p className="eyebrow">{'The brand video diary'}</p><h3>{'Happiness, in motion.'}</h3><div>{videos.map(([id, en]) => <figure key={id}><video controls playsInline preload="none" poster={`/assets/catalog/videos/${id}.webp`} aria-label={en}><source src={`/assets/catalog/videos/${id}.mp4`} type="video/mp4" /></video><figcaption>{en}</figcaption></figure>)}</div></div>;
}
