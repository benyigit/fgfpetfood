'use client';
import { useEffect, useRef, useState } from 'react';
import { AdminIcon } from './admin-icons';
import { SHARED_SHOPIFY_STORE, type ShopifyAdminStatus, type ShopifyDraftInput, type ShopifyDraftResult, type ShopifyImportResult } from '@/lib/shopify-admin-types';
import s from './admin-commerce.module.css';

class CommerceRequestError extends Error { constructor(message: string, public code: string) { super(message); } }
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store' });
  const data = await response.json().catch(() => ({ error: 'The response could not be read. Please check the connection.', code: 'RESPONSE_UNKNOWN' }));
  if (!response.ok || data.error) throw new CommerceRequestError(data.error || 'The request could not be completed.', data.code || 'REQUEST_FAILED');
  return data as T;
}
function message(error: unknown) { return error instanceof Error ? error.message : 'The request could not be completed.'; }
function Modal({ title, children, close, busy = false }: { title: string; children: React.ReactNode; close: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog?.close(); document.body.style.overflow = overflow; }; }, []);
  return <dialog className={s.modal} ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <header><div><span className={s.eyebrow}>YOUR SHOPIFY CONNECTION</span><h2>{title}</h2></div><button type="button" className={s.iconButton} disabled={busy} onClick={close} aria-label="Close"><AdminIcon name="close" /></button></header>{children}
  </dialog>;
}
export function AdminCommerce({ brand, onImported }: { brand: 'quipaw' | 'fgfpetfood'; onImported: () => void | Promise<void> }) {
  const [connection, setConnection] = useState<ShopifyAdminStatus | null>(null);
  const [checking, setChecking] = useState(false), [importing, setImporting] = useState(false), [creating, setCreating] = useState(false);
  const [error, setError] = useState(''), [result, setResult] = useState<ShopifyImportResult | null>(null);
  const [dialog, setDialog] = useState<'connect' | 'product' | null>(null);
  const [created, setCreated] = useState<ShopifyDraftResult | null>(null), [createError, setCreateError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const empty = { requestId: '', title: '', description: '', productType: 'Dog treats', vendor: 'Quipaw' };
  const [form, setForm] = useState<ShopifyDraftInput>(empty);
  const canImport = !!connection?.domainMatches && (connection.admin.configured ? connection.admin.verified && connection.admin.readProducts : connection.storefront.verified);
  const canCreate = !!connection?.domainMatches && connection.admin.verified && connection.admin.writeProducts;
  const busy = checking || importing || creating;
  const shopUrl = connection?.adminUrl || `https://admin.shopify.com/store/${SHARED_SHOPIFY_STORE.replace('.myshopify.com', '')}/products`;
  async function check() {
    setChecking(true); setError('');
    try { setConnection((await request<{ connection: ShopifyAdminStatus }>('/api/admin/shopify/status')).connection); }
    catch (cause) { setConnection(null); setError(message(cause)); }
    finally { setChecking(false); }
  }
  useEffect(() => { void check(); }, []);
  async function imported() { try { await onImported(); } catch { setError('The Shopify action completed, but the product list could not refresh. Reload the studio to see the latest entries.'); } }
  async function sync() {
    setImporting(true); setError(''); setResult(null);
    try { const data = await request<ShopifyImportResult>('/api/admin/shopify/import', { method: 'POST' }); setResult(data); await imported(); }
    catch (cause) { setError(message(cause)); }
    finally { setImporting(false); }
  }
  function startProduct() { setForm({ ...empty, requestId: crypto.randomUUID() }); setCreated(null); setCreateError(''); setUncertain(false); setDialog('product'); }
  function update(key: 'title' | 'description' | 'productType' | 'vendor', value: string) {
    setForm(current => ({ ...current, [key]: value, requestId: crypto.randomUUID() })); setCreateError('');
  }
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (!canCreate || creating || uncertain) return;
    setCreating(true); setCreateError('');
    try {
      const data = await request<ShopifyDraftResult>('/api/admin/shopify/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setCreated(data); await imported();
    } catch (cause) {
      setCreateError(message(cause));
      if (!(cause instanceof CommerceRequestError) || ['CREATE_OUTCOME_UNKNOWN', 'RESPONSE_UNKNOWN', 'REQUEST_FAILED'].includes(cause.code)) setUncertain(true);
    } finally { setCreating(false); }
  }
  return <section className={s.commerce} data-brand={brand} aria-labelledby="shopify-connection-title">
    <div className={s.heading}><div className={s.shopifyMark} aria-hidden="true"><AdminIcon name="product" size={27} /></div><div><span className={s.eyebrow}>ONE STORE. TWO HAPPY BRANDS.</span><h2 id="shopify-connection-title">Your products, connected.</h2><p>Shopify manages prices, stock and checkout. Your studio gives each product its website story.</p></div><button className={s.primary} type="button" onClick={startProduct} disabled={busy}><AdminIcon name="plus" size={18} />New product</button></div>
    <div className={s.connectionGrid}>
      <div className={s.checkCard}><span className={s.state} data-ready={connection?.storefront.verified}><i />{checking ? 'Checking…' : connection?.storefront.verified ? 'Catalog connected' : 'Connection needed'}</span><h3>Website & checkout</h3><p>{connection?.storefront.message || 'Check the Shopify connection for this website.'}</p></div>
      <div className={s.checkCard}><span className={s.state} data-ready={connection?.admin.verified && connection.admin.readProducts}><i />{checking ? 'Checking…' : connection?.admin.verified && connection.admin.writeProducts ? 'Draft creation ready' : connection?.admin.verified && connection.admin.readProducts ? 'Import ready' : 'Connection needed'}</span><h3>Product management</h3><p>{connection?.admin.message || 'Connect Shopify Admin access for product import and creation.'}</p></div>
    </div>
    <div className={s.actions}><button className={s.secondary} onClick={sync} disabled={busy || !canImport}><AdminIcon name="upload" size={17} />{importing ? 'Importing products…' : 'Import / sync products'}</button><button className={s.textButton} onClick={() => setDialog('connect')} disabled={creating}><AdminIcon name="link" size={16} />{connection?.storefront.verified && connection.admin.writeProducts ? 'Connection details' : 'Connect Shopify'}</button><button className={s.textButton} onClick={check} disabled={busy}>{checking ? 'Checking…' : 'Refresh status'}</button><a href={shopUrl} target="_blank" rel="noopener noreferrer">Open Shopify <AdminIcon name="arrow" size={16} /></a></div>
    {error && <div className={s.error} role="alert">{error}</div>}
    {result && <div className={s.success} role="status"><AdminIcon name="check" size={19} /><div><strong>{result.total === 0 ? 'No Shopify products found for this connection.' : 'Your product list is up to date.'}</strong><p>{result.message}</p>{result.source === 'storefront' && <small>This import includes only products published to the connected Storefront channel.</small>}</div></div>}
    <p className={s.footnote}>Existing website drafts are kept when you import. {connection?.checkout.message || 'Checkout has not been verified yet.'}</p>
    {dialog === 'connect' && <Modal title="Connect your shared store" close={() => setDialog(null)} busy={creating}>
      <div className={s.store}><span>QUIPAW + FGF PET FOOD BAZAAR</span><strong>{SHARED_SHOPIFY_STORE}</strong><small>{connection?.domain ? `Configured on this website: ${connection.domain}` : 'This website has not been connected yet.'}</small></div>
      <ol className={s.setup}><li><b>1</b><div><h3>Give both websites Storefront access</h3><p>The Shopify owner installs Headless, creates a storefront and gives the developer its private Storefront token. Publish the products to that storefront so they can appear here.</p><a href="https://help.shopify.com/en/manual/custom-storefronts/headless" target="_blank" rel="noopener noreferrer">Shopify Headless setup ↗</a></div></li><li><b>2</b><div><h3>Allow product management</h3><p>Install the integration app on the same store with <code>write_products</code>. This includes product reading and allows this studio to create drafts. The developer adds its Admin API access token to the server.</p><small>A collaborator invitation gives a person access; it does not connect this website’s API access.</small></div></li><li><b>3</b><div><h3>Check both websites, then finish checkout setup</h3><p>Use the same Shopify store for Quipaw and FGF, then refresh this status on each site. The owner completes payment, shipping, market and store-password settings before a separate checkout check.</p></div></li></ol>
      <details className={s.developer}><summary>Connection settings for your developer</summary><p>Configure these server environment variables in both Vercel projects and deploy. Keep token values in server settings.</p><code>SHOPIFY_STORE_DOMAIN={SHARED_SHOPIFY_STORE}<br />SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN<br />SHOPIFY_ADMIN_ACCESS_TOKEN</code><p>An existing public Storefront token can use <code>SHOPIFY_STOREFRONT_ACCESS_TOKEN</code>. Admin access requires an installed app’s access token; a client secret or collaborator code is not an access token.</p></details>
      <aside className={s.cartNote}><AdminIcon name="product" size={20} /><p>Both sites can lead to the same Shopify store and order system. Their bags stay separate because they are on different domains; this setup does not automatically move a shopper’s cart between brands.</p></aside>
      <div className={s.modalActions}><a className={s.secondary} href={shopUrl} target="_blank" rel="noopener noreferrer">Open Shopify ↗</a><button className={s.primary} disabled={checking} onClick={check}>{checking ? 'Checking…' : 'Check connection'}</button></div>
      {connection && <p className={s.modalStatus} role="status">{connection.storefront.message} {connection.admin.message}</p>}
    </Modal>}
    {dialog === 'product' && <Modal title={created ? 'A new treat, in the making.' : 'Create a Shopify product'} close={() => setDialog(null)} busy={creating}>
      {created ? <div className={s.created}><span className={s.createdIcon}><AdminIcon name="check" size={32} /></span><span className={s.state} data-ready>SHOPIFY DRAFT</span><h3>{created.product.title}</h3><p>{created.message}</p>{created.warning && <p className={s.error}>{created.warning}</p>}<a className={s.primary} href={created.product.adminUrl} target="_blank" rel="noopener noreferrer">Finish in Shopify <AdminIcon name="arrow" size={18} /></a><button className={s.textButton} type="button" onClick={() => setDialog(null)}>Back to products</button></div> : !canCreate ? <div className={s.connectionRequired}><AdminIcon name="link" size={32} /><h3>Connect Shopify to add a product.</h3><p>{connection?.admin.message || 'Product creation needs a working Shopify Admin connection with product permissions.'}</p><p>Your new product will be created as a real Shopify draft, ready for its price, inventory and images.</p><div className={s.modalActions}><button className={s.primary} onClick={() => setDialog('connect')}>Connect Shopify <AdminIcon name="arrow" size={17} /></button><a className={s.secondary} href={shopUrl} target="_blank" rel="noopener noreferrer">Open Shopify ↗</a></div></div> : <form onSubmit={create} className={s.productForm}>
        <p className={s.formIntro}>Start with the essentials. This creates a draft in Shopify and a website draft in this studio.</p>
        <fieldset disabled={creating || uncertain}><label>Product name<input required maxLength={180} value={form.title} onChange={event => update('title', event.target.value)} placeholder="Give this good thing a name" /></label><div className={s.formGrid}><label>Product type<input maxLength={80} value={form.productType} onChange={event => update('productType', event.target.value)} /></label><label>Brand / vendor<input maxLength={80} value={form.vendor} onChange={event => update('vendor', event.target.value)} /></label></div><label>Description<textarea rows={5} maxLength={15000} value={form.description} onChange={event => update('description', event.target.value)} placeholder="What should people know about this product?" /></label></fieldset>
        <div className={s.draftNote}><AdminIcon name="save" size={20} /><p>It starts as a Shopify draft. Finish price, variants, stock and images in Shopify, then activate it and publish it to the Headless storefront. Saving here does not put it on sale.</p></div>
        {createError && <div className={s.error} role="alert">{createError}{uncertain && <p><a href={shopUrl} target="_blank" rel="noopener noreferrer">Check Shopify Products ↗</a></p>}</div>}
        <div className={s.modalActions}><button className={s.secondary} type="button" disabled={creating} onClick={() => setDialog(null)}>Cancel</button><button className={s.primary} type="submit" disabled={creating || uncertain}>{creating ? 'Creating Shopify draft…' : 'Create draft in Shopify'}<AdminIcon name="plus" size={17} /></button></div>
      </form>}
    </Modal>}
  </section>;
}
