import type { CMSMedia } from '@/lib/cms-types';
import styles from './content-media.module.css';

export function ContentMedia({ media, className = '', preview = false, priority = false }: {
  media: CMSMedia; className?: string; preview?: boolean; priority?: boolean;
}) {
  if (!media.src) return null;
  const classes = `${styles.media} ${className}`;
  if (media.type === 'video') {
    if (preview && media.poster) return <img className={classes} src={media.poster} alt={media.alt} loading={priority ? 'eager' : 'lazy'} />;
    return <video className={classes} controls={!preview} playsInline preload="metadata" poster={media.poster || undefined}
      muted={preview} tabIndex={preview ? -1 : undefined} aria-hidden={preview || undefined} aria-label={preview ? undefined : media.alt}
      src={media.src}>Your browser does not support this video.</video>;
  }
  return <img className={classes} src={media.src} alt={media.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} />;
}
