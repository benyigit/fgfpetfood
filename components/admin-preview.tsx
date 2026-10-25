'use client';

import { useEffect, useRef, useState } from 'react';
import type { CMSContent, CMSKind } from '@/lib/cms-types';
import { AdminIcon } from './admin-icons';
import styles from './admin-preview.module.css';

export type PreviewDraft = { kind: CMSKind; slug: string; content: CMSContent; id?: string };
type Props = PreviewDraft & { brand: 'quipaw' | 'fgfpetfood' };
type Device = 'desktop' | 'mobile';

function DeviceControls({ device, setDevice }: { device: Device; setDevice: (device: Device) => void }) {
  return <div className={styles.devices} role="group" aria-label="Preview screen size">
    <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8m-4-5v5"/></svg>Desktop</button>
    <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg>Mobile</button>
  </div>;
}

function Viewport({ draft, device, expanded = false }: { draft: PreviewDraft; device: Device; expanded?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const lastSent = useRef(0);
  const readyRef = useRef(false);
  const [channel, setChannel] = useState('');
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const viewportWidth = device === 'desktop' ? 1280 : 390;
  const scale = Math.min(1, Math.max(1, width) / viewportWidth);
  const viewportHeight = Math.max(1, Math.floor((height || 500) / scale));
  useEffect(() => { setChannel(crypto.randomUUID()); }, []);
  useEffect(() => {
    const element = host.current; if (!element) return;
    const measure = () => { setWidth(element.clientWidth); setHeight(element.clientHeight); };
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!channel) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.channel !== channel) return;
      if (event.data.type === 'brand-preview-ready') { readyRef.current = true; setReady(true); setError(''); }
      if (event.data.type === 'brand-preview-applied' && event.data.sequence === lastSent.current) setSynced(true);
      if (event.data.type === 'brand-preview-error') setError(typeof event.data.message === 'string' ? event.data.message : 'This preview could not be opened.');
      if (event.data.type === 'brand-preview-notice') setNotice('You are viewing a private preview. Links and submissions stay here.');
    };
    window.addEventListener('message', receive);
    const timeout = window.setTimeout(() => setError(current => current || (!readyRef.current ? 'The private preview is taking longer than expected. Try refreshing it.' : '')), 30000);
    return () => { window.removeEventListener('message', receive); window.clearTimeout(timeout); };
  }, [channel]);
  useEffect(() => {
    if (!ready || !channel) return;
    setSynced(false);
    const timer = window.setTimeout(() => {
      const sequence = ++lastSent.current;
      frame.current?.contentWindow?.postMessage({ type: 'brand-preview-update', channel, sequence, draft }, window.location.origin);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [draft, ready, channel]);
  return <div className={styles.viewport} data-expanded={expanded}>
    <div className={styles.frameStage} ref={host} data-device={device}>
      {channel && <div className={styles.frameSize} style={{ width: viewportWidth * scale, height: viewportHeight * scale }}><iframe ref={frame} src={`/admin/preview?channel=${encodeURIComponent(channel)}`} title={`${device === 'desktop' ? 'Desktop' : 'Mobile'} private website preview`} className={styles.frame} style={{ width: viewportWidth, height: viewportHeight, transform: `scale(${scale})` }} sandbox="allow-scripts allow-same-origin" referrerPolicy="same-origin" /></div>}
      {!ready && !error && <div className={styles.loading} role="status"><span className={styles.loadingFlower} aria-hidden="true">✿</span><strong>Opening your website…</strong><span>Preparing your private preview.</span></div>}
      {error && <div className={styles.loading} role="alert"><AdminIcon name="eye" size={30}/><strong>Let’s try that again.</strong><p>{error}</p><button type="button" onClick={() => { setError(''); readyRef.current = false; setReady(false); setChannel(crypto.randomUUID()); }}>Refresh preview ↻</button></div>}
    </div>
    <div className={styles.frameStatus}><span aria-live="polite"><i data-ready={synced}/>{ready ? synced ? 'Preview up to date' : 'Updating your preview…' : 'Loading preview…'}</span><span>{viewportWidth}px · {Math.round(scale * 100)}%</span></div>
    {notice && <p className={styles.privateNotice} role="status">{notice}</p>}
  </div>;
}

export function AdminPreview({ brand, ...draft }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const path = draft.kind === 'page' ? '/' : `/${draft.kind === 'article' ? 'blog' : draft.kind === 'event' ? 'events' : 'shop'}/${draft.slug || 'your-new-page'}`;
  useEffect(() => {
    if (!expanded) return;
    const element = dialog.current; element?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previous; expandButton.current?.focus(); };
  }, [expanded]);
  return <section className={styles.panel} data-brand={brand} aria-label="Website preview">
    <header className={styles.heading}><div><span>YOUR WEBSITE, AS IT WILL LOOK</span><h2>See it come to life.</h2></div><button ref={expandButton} type="button" className={styles.expand} onClick={() => setExpanded(true)} aria-label="Open larger website preview"><AdminIcon name="eye" size={17}/>Expand</button></header>
    <div className={styles.browserBar}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span className={styles.address}>{brand === 'quipaw' ? 'quipaw.com' : 'fgfpetfood.com'}{path}</span><span className={styles.private}>Private</span></div>
    <div className={styles.toolbar}><DeviceControls device={device} setDevice={setDevice}/><span>Unsaved changes included</span></div>
    {!expanded && <Viewport draft={draft} device={device}/>}
    <p className={styles.caption}>The same layout, typography and media as your website. Changes remain private until you publish.</p>
    {expanded && <dialog ref={dialog} className={styles.dialog} data-brand={brand} onCancel={() => setExpanded(false)} aria-labelledby="expanded-preview-title">
      <header className={styles.dialogHeader}><div><span className={styles.private}>PRIVATE PREVIEW</span><h2 id="expanded-preview-title">{draft.content.title || 'Your next good story'}</h2></div><DeviceControls device={device} setDevice={setDevice}/><button type="button" className={styles.close} onClick={() => setExpanded(false)} aria-label="Close larger preview"><AdminIcon name="close"/></button></header>
      <Viewport draft={draft} device={device} expanded/>
    </dialog>}
  </section>;
}
