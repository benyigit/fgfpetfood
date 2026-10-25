import type { CSSProperties, ReactNode } from 'react';
export type AdminIconName = 'home' | 'product' | 'article' | 'event' | 'page' | 'inbox' | 'media' | 'arrow' | 'plus' | 'close' | 'search' | 'check' | 'image' | 'video' | 'upload' | 'logout' | 'eye' | 'chevron' | 'save' | 'mail' | 'archive' | 'sparkles' | 'link' | 'copy';
const paths: Record<AdminIconName, ReactNode> = {
  sparkles: <><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/><path d="M20 2v4m-2-2h4M3 19v3m-1.5-1.5h3"/></>,
  link: <><path d="m10 13 4-4m-6 6-2 2a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0m4 2 2-2a4.2 4.2 0 0 1 6 6l-4 4a4.2 4.2 0 0 1-6 0"/></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
  home: <><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></>,
  product: <><path d="m4 7 8-4 8 4v11l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 11v11M8 5l8 4"/></>,
  article: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
  event: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2"/></>,
  page: <><path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8m-8 4h6"/></>,
  inbox: <><path d="M5 4h14l3 10v6H2v-6Z"/><path d="M2 14h6l2 3h4l2-3h6M8 8h8"/></>,
  media: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 6-6 8 11m-3-7 3-3 4 4"/><circle cx="16" cy="8" r="1"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, close: <path d="m6 6 12 12M6 18 18 6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>, check: <path d="m5 12 4 4L19 6"/>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m3 16 5-5 6 6 3-3 4 4"/><circle cx="16" cy="9" r="1"/></>,
  video: <><rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/></>,
  upload: <><path d="M12 15V3m-4 4 4-4 4 4M4 15v6h16v-6"/></>, logout: <><path d="M10 4H4v16h6m4-12 4 4-4 4M8 12h12"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>, save: <><path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h9V3M7 21v-8h10v8"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 6 9 7 9-7"/></>,
  archive: <><path d="M4 8h16v13H4Z"/><path d="M3 3h18v5H3ZM9 13h6"/></>,
};
export function AdminIcon({name,size=20,style}:{name:AdminIconName;size?:number;style?:CSSProperties}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
