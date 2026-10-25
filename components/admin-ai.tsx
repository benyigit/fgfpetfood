'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CMSDocument, CMSMedia } from '@/lib/cms-types';
import type { AIGenerateResult, AIStudioStatus, AIStudioTone, SocialDraft, SocialDraftInput, SocialPlatform } from '@/lib/ai-studio-types';
import { AdminIcon } from './admin-icons';
import { AdminMediaDialog } from './admin-media';
import { AdminRequestError, adminRequest, errorMessage, savedDate } from './admin-shared';
import a from './admin-ai.module.css';
import s from './admin-studio.module.css';

const platformName = (platform: SocialPlatform) => platform === 'instagram' ? 'Instagram' : 'Facebook';
const editable = (draft: SocialDraft) => draft.status === 'draft' || draft.status === 'failed';
const inputFrom = (draft: SocialDraft): SocialDraftInput => ({platform:draft.platform,caption:draft.caption,mediaSrc:draft.mediaSrc,mediaAlt:draft.mediaAlt,sourceProductId:draft.sourceProductId});
const emptyInput = (): SocialDraftInput => ({platform:'instagram',caption:'',mediaSrc:'',mediaAlt:''});
const statusLabel: Record<SocialDraft['status'],string> = {draft:'Draft',failed:'Needs attention',publishing:'Publishing',published:'Published',uncertain:'Check publication'};

function PublishDialog({draft,account,onClose,onPublish,busy}:{draft:SocialDraft;account:string;onClose:()=>void;onPublish:()=>void;busy:boolean}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [approved,setApproved]=useState(false);
  useEffect(()=>{dialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.current?.close();document.body.style.overflow=overflow;};},[]);
  return <dialog ref={dialog} className={a.dialog} onCancel={event=>{event.preventDefault();if(!busy)onClose();}} aria-labelledby="social-publish-title">
    <span className={s.eyebrow}>ONE LAST LOOK</span><h2 id="social-publish-title">Ready to share this?</h2>
    <p>This will publish your saved post to the brand’s {platformName(draft.platform)} account.</p>
    <div className={a.dialogTarget}><AdminIcon name="link"/><div><strong>{platformName(draft.platform)}</strong><br/><small>Account {account}</small></div></div>
    {draft.mediaSrc&&<img src={draft.mediaSrc} alt={draft.mediaAlt} style={{width:'100%',maxHeight:220,objectFit:'contain',borderRadius:12,marginBottom:14}}/>}
    <div className={a.dialogCaption}>{draft.caption}</div>
    <label className={a.approval}><input type="checkbox" checked={approved} disabled={busy} onChange={event=>setApproved(event.target.checked)}/><span>I have reviewed this post and have permission to publish its words and media on this brand’s social account.</span></label>
    <div className={a.actions}><button type="button" className={s.primary} disabled={!approved||busy} onClick={onPublish}>{busy?'Publishing…':'Publish now'}<AdminIcon name="arrow"/></button><button type="button" className={s.secondary} disabled={busy} onClick={onClose}>Keep as draft</button></div>
  </dialog>;
}

export function AdminAI({brand,documents,onDocumentSaved,onDirtyChange}:{brand:'quipaw'|'fgfpetfood';documents:CMSDocument[];onDocumentSaved:(document:CMSDocument,warnings:string[])=>void;onDirtyChange?:(dirty:boolean)=>void}) {
  const name=brand==='quipaw'?'Quipaw':'FGF Pet Food Bazaar';
  const [tab,setTab]=useState<'create'|'drafts'|'connections'>('create');
  const [status,setStatus]=useState<AIStudioStatus|null>(null);
  const [drafts,setDrafts]=useState<SocialDraft[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<'generate'|'save'|'publish'|'refresh'|null>(null);
  const [error,setError]=useState('');
  const [generationFailed,setGenerationFailed]=useState(false);
  const [saveConflict,setSaveConflict]=useState(false);
  const [manualRecovery,setManualRecovery]=useState(false);
  const manualPayload=useRef<(SocialDraftInput&{requestId:string})|null>(null);
  const [notice,setNotice]=useState('');
  const [target,setTarget]=useState<'blog'|'social'>('blog');
  const [productId,setProductId]=useState('');
  const [topic,setTopic]=useState('');
  const [tone,setTone]=useState<AIStudioTone>('friendly');
  const [instructions,setInstructions]=useState('');
  const [platform,setPlatform]=useState<SocialPlatform>('instagram');
  const [composer,setComposer]=useState(false);
  const [selected,setSelected]=useState<SocialDraft|null>(null);
  const [input,setInput]=useState<SocialDraftInput>(emptyInput);
  const [mediaOpen,setMediaOpen]=useState(false);
  const [confirmPublish,setConfirmPublish]=useState(false);
  const generateRequest=useRef({body:'',id:''});
  const manualRequest=useRef('');
  const publishRequest=useRef('');
  const form=useRef<HTMLFormElement>(null);
  const products=documents.filter(document=>document.kind==='product');
  const source=products.find(product=>product.id===productId);
  const draftDirty=composer&&(selected?JSON.stringify(input)!==JSON.stringify(inputFrom(selected)):!!input.caption||!!input.mediaSrc);
  const locked=!!selected&&!editable(selected);

  useEffect(()=>{onDirtyChange?.(draftDirty||!!busy);return()=>onDirtyChange?.(false);},[draftDirty,busy,onDirtyChange]);
  useEffect(()=>{if(!draftDirty&&!busy)return;const prevent=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',prevent);return()=>window.removeEventListener('beforeunload',prevent);},[draftDirty,busy]);
  async function refresh(){
    setLoading(true);setError('');
    const results=await Promise.allSettled([adminRequest<AIStudioStatus>('/api/admin/ai/status'),adminRequest<{drafts:SocialDraft[]}>('/api/admin/social')]);
    let failure='';
    if(results[0].status==='fulfilled')setStatus(results[0].value);else failure=errorMessage(results[0].reason);
    if(results[1].status==='fulfilled')setDrafts(results[1].value.drafts);else failure ||= errorMessage(results[1].reason);
    setError(failure);setLoading(false);
  }
  useEffect(()=>{void refresh();},[]);
  function keep(draft:SocialDraft){setDrafts(previous=>[draft,...previous.filter(item=>item.id!==draft.id)]);setSelected(draft);setInput(inputFrom(draft));}
  function chooseTab(next:typeof tab){if(busy)return;if(draftDirty&&!window.confirm('Leave this post? Save your draft first to keep your changes.'))return;setComposer(false);setTab(next);setError('');setNotice('');}
  function openDraft(draft:SocialDraft|null){if(busy)return;if(draftDirty&&!window.confirm('Leave this post without saving your changes?'))return;setSelected(draft);setInput(draft?inputFrom(draft):emptyInput());manualRequest.current=crypto.randomUUID();manualPayload.current=null;setManualRecovery(false);setSaveConflict(false);setComposer(true);setTab('drafts');setError('');setNotice('');}
  async function generate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!status?.ai.configured)return;setBusy('generate');setError('');setNotice('');setGenerationFailed(false);
    const body={target,productId,topic,tone,instructions,platform:target==='social'?platform:undefined};
    const signature=JSON.stringify(body);if(signature!==generateRequest.current.body)generateRequest.current={body:signature,id:crypto.randomUUID()};
    try{const result=await adminRequest<AIGenerateResult>('/api/admin/ai/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:generateRequest.current.id})});
      if(result.document){onDocumentSaved(result.document,result.warnings);return;}
      if(result.draft){keep(result.draft);setComposer(true);setTab('drafts');setNotice(result.warnings.length?result.warnings.join(' '):'Your first draft is ready. Make it sound like you before sharing.');}
      else throw new Error('No draft was returned. Please try again.');
      generateRequest.current={body:'',id:''};
    }catch(cause){setError(errorMessage(cause));setGenerationFailed(true);}finally{setBusy(null);}
  }
  async function save(){
    if(busy||locked||manualRecovery||!form.current?.reportValidity())return;setBusy('save');setError('');setNotice('');setSaveConflict(false);
    if(!manualRequest.current)manualRequest.current=crypto.randomUUID();
    if(!selected)manualPayload.current={...input,requestId:manualRequest.current};
    try{const result=await adminRequest<{draft:SocialDraft}>(selected?`/api/admin/social/${selected.id}`:'/api/admin/social',{method:selected?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,...(selected?{revision:selected.revision}:{requestId:manualRequest.current})})});keep(result.draft);setNotice('Post saved. It is ready for your review.');}catch(cause){setError(errorMessage(cause));setSaveConflict(!!selected&&cause instanceof AdminRequestError&&cause.status===409);setManualRecovery(!selected&&(!(cause instanceof AdminRequestError)||cause.status>=500||cause.status===409));}finally{setBusy(null);}
  }
  async function recoverManual(){if(!manualPayload.current||busy)return;setBusy('save');setError('');const currentInput=input;try{const data=await adminRequest<{draft:SocialDraft}>('/api/admin/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(manualPayload.current)});keep(data.draft);setInput(currentInput);setManualRecovery(false);setNotice('Your saved draft has been recovered. Save any newer edits before publishing.');}catch(cause){setError(errorMessage(cause));}finally{setBusy(null);}}
  async function loadLatest(){if(!selected||busy)return;if(draftDirty&&!window.confirm('Discard these unsaved changes and load the latest saved post?'))return;setBusy('refresh');try{const data=await adminRequest<{drafts:SocialDraft[]}>('/api/admin/social');const draft=data.drafts.find(item=>item.id===selected.id);if(!draft)throw new Error('This draft is no longer available.');setDrafts(data.drafts);keep(draft);setSaveConflict(false);setError('');setNotice('The latest saved post is open.');}catch(cause){setError(errorMessage(cause));}finally{setBusy(null);}}
  async function publish(){
    if(!selected||busy)return;setBusy('publish');setError('');setNotice('');
    try{const result=await adminRequest<{draft:SocialDraft}>(`/api/admin/social/${selected.id}/publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:selected.revision,requestId:publishRequest.current,accountId:connection?.accountId,confirm:true,rightsConfirmed:true})});keep(result.draft);setNotice(result.draft.status==='published'?`Published on ${platformName(result.draft.platform)}.`:'Your publication status has been updated.');}
    catch(cause){setError(errorMessage(cause));const results=await Promise.allSettled([adminRequest<{drafts:SocialDraft[]}>('/api/admin/social')]);if(results[0].status==='fulfilled'){setDrafts(results[0].value.drafts);const current=results[0].value.drafts.find(draft=>draft.id===selected.id);if(current)keep(current);}}
    finally{setBusy(null);setConfirmPublish(false);}
  }
  async function refreshPublication(){if(!selected||busy)return;setBusy('refresh');setError('');try{const result=await adminRequest<{draft:SocialDraft}>(`/api/admin/social/${selected.id}/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});keep(result.draft);setNotice('Publication status refreshed.');}catch(cause){setError(errorMessage(cause));}finally{setBusy(null);}}
  function pickMedia(media:CMSMedia){setInput(previous=>({...previous,mediaSrc:media.src,mediaAlt:media.alt}));}
  const connection=input.platform==='instagram'?status?.instagram:status?.facebook;
  const publishable=!!selected&&editable(selected)&&!draftDirty&&!!connection?.configured&&!!input.caption.trim()&&(input.platform!=='instagram'||!!input.mediaSrc);

  return <section className={a.studio}>
    <div className={a.tabs} role="group" aria-label="AI studio sections">{(['create','drafts','connections'] as const).map(value=><button key={value} type="button" aria-pressed={tab===value} disabled={!!busy} onClick={()=>chooseTab(value)}>{value==='create'?'Create a little story':value==='drafts'?'Social drafts':'Connections'}{value==='drafts'&&drafts.length>0&&<small>{drafts.length}</small>}</button>)}</div>
    {error&&<div className={s.error} role="alert">{error} {manualRecovery?<button type="button" className={s.textButton} disabled={!!busy} onClick={recoverManual}>Recover saved draft</button>:saveConflict&&selected?<button type="button" className={s.textButton} disabled={!!busy} onClick={loadLatest}>Load latest saved draft</button>:generationFailed?<button type="button" className={s.textButton} disabled={!!busy} onClick={()=>{generateRequest.current={body:'',id:''};setGenerationFailed(false);setError('');setNotice('Ready for a fresh generation. Choose Create a draft to send a new request.');}}>Start a new attempt</button>:<button type="button" className={s.textButton} disabled={!!busy} onClick={refresh}>Refresh</button>}</div>}
    {notice&&<div className={s.notice} role="status">{notice}</div>}
    {loading?<div className={s.empty} role="status">Opening your creative space…</div>:<>
      {tab==='create'&&<>
        <div className={a.intro}><div><span className={s.eyebrow}>A LITTLE INSPIRATION, A LOT OF YOU</span><h2>Good ideas. <em>Your voice.</em></h2><p>Start with the products you know. Shape a helpful blog story or a social post, then give it your own finishing touch.</p></div><span className={a.introMark}><AdminIcon name="sparkles" size={45}/></span></div>
        <div className={a.createLayout}><form className={a.card} onSubmit={generate}><div className={a.mode}><button type="button" aria-pressed={target==='blog'} onClick={()=>setTarget('blog')} disabled={!!busy}><AdminIcon name="article"/> A blog story</button><button type="button" aria-pressed={target==='social'} onClick={()=>setTarget('social')} disabled={!!busy}><AdminIcon name="image"/> A social moment</button></div>
          <fieldset className={a.fields} disabled={!!busy} style={{border:0,padding:0}}>
            <label>Which product is the story about?<select required value={productId} onChange={event=>setProductId(event.target.value)}><option value="">Choose a product</option>{products.map(product=><option key={product.id} value={product.id}>{product.draft.title}</option>)}</select><small>Uses the product information already saved in your studio.</small></label>
            <label>Your idea<input required maxLength={300} value={topic} onChange={event=>setTopic(event.target.value)} placeholder="e.g. Making the most of a cosy afternoon with a chew"/></label>
            <div className={a.twoFields}><label>The feel<select value={tone} onChange={event=>setTone(event.target.value as AIStudioTone)}><option value="friendly">Warm & friendly</option><option value="educational">Clear & helpful</option><option value="playful">Playful & light</option></select></label>{target==='social'&&<label>Where will it go?<select value={platform} onChange={event=>setPlatform(event.target.value as SocialPlatform)}><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label>}</div>
            <label>A little direction <small>Optional</small><textarea rows={4} maxLength={2000} value={instructions} onChange={event=>setInstructions(event.target.value)} placeholder="Who is this for? Is there a message you would like to include?"/></label>
          </fieldset>
          {!status?.ai.configured&&<div className={a.setupNote}><AdminIcon name="link" size={18}/><p>AI generation is waiting for your account connection. <button type="button" onClick={()=>chooseTab('connections')}>See setup</button>. You can start writing a social post yourself today.</p></div>}
          <div className={a.actions}><button className={s.primary} type="submit" disabled={!!busy||!status?.ai.configured||!products.length}><AdminIcon name="sparkles"/>{busy==='generate'?'Making your first draft…':'Create a draft'}</button><button className={s.textButton} type="button" disabled={!!busy} onClick={()=>openDraft(null)}>Write my own post →</button></div>
          {busy==='generate'&&<p className={a.busy} role="status"><span/>Giving your idea a little shape. Your draft will be saved here.</p>}
        </form><aside className={a.guide}><span className={s.eyebrow}>FROM IDEA TO SOMETHING GOOD</span><h3>A helping hand.<br/>You keep the pen.</h3><p>Your product details give the draft its starting point. You decide what makes it into the finished story.</p><ol className={a.steps}><li><span>01</span><div><strong>Choose the real details</strong><p>Pick a product and tell us the story you want to tell.</p></div></li><li><span>02</span><div><strong>Make it yours</strong><p>Edit the words, choose your media and review the full page.</p></div></li><li><span>03</span><div><strong>Share when you’re ready</strong><p>Publish a blog from its editor, or approve a social post for your connected account.</p></div></li></ol>{source&&<div className={a.source}><span>YOUR SOURCE MATERIAL</span><strong>{source.draft.title}</strong><p>{source.draft.excerpt}</p><dl>{source.draft.product?.ingredients&&<div><dt>Ingredients</dt><dd>{source.draft.product.ingredients}</dd></div>}{source.draft.product?.packSize&&<div><dt>Pack size</dt><dd>{source.draft.product.packSize}</dd></div>}</dl></div>}</aside></div>
      </>}
      {tab==='drafts'&&(!composer?<>
        <header className={a.libraryHeading}><div><h2>A little queue of good things.</h2><p>Saved posts, thoughtful edits and moments you’ve shared.</p></div><button className={s.primary} type="button" onClick={()=>openDraft(null)}><AdminIcon name="plus"/>New post</button></header>
        {drafts.length?<div className={a.draftGrid}>{drafts.map(draft=><article key={draft.id} className={a.postCard}><div className={a.postImage}>{draft.mediaSrc?<img src={draft.mediaSrc} alt={draft.mediaAlt} loading="lazy"/>:<AdminIcon name="article" size={34}/>}</div><div className={a.postContent}><div className={a.postTop}><strong>{platformName(draft.platform)}</strong><span className={a.status} data-ready={draft.status==='published'}>{statusLabel[draft.status]}</span></div><p className={a.postCaption}>{draft.caption||'Your next good little post.'}</p><div className={a.postFooter}><small>{savedDate(draft.updatedAt)}</small><button className={s.textButton} onClick={()=>openDraft(draft)}>Open post →</button></div></div></article>)}</div>:<div className={a.empty}><AdminIcon name="image" size={32}/><h3>Your next happy moment starts here.</h3><p>Make a social draft with AI, or write a little something yourself.</p><button className={s.secondary} onClick={()=>chooseTab('create')}>Find a little inspiration<AdminIcon name="arrow"/></button></div>}
      </>:<section className={a.composer}>
        <div className={a.composerHeading}><div><button className={s.back} type="button" disabled={!!busy} onClick={()=>chooseTab('drafts')}>← All social posts</button><h2>{selected?.status==='published'?'A moment, shared.':'Make it sound like you.'}</h2></div><span className={a.status} data-ready={selected?.status==='published'}>{draftDirty?'Unsaved changes':selected?statusLabel[selected.status]:'New draft'}</span></div>
        <div className={a.composerLayout}><form ref={form} onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={!!busy||locked} className={a.composerForm}>
          <label>Share on<select value={input.platform} onChange={event=>setInput(previous=>({...previous,platform:event.target.value as SocialPlatform}))}><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label>
          <label>Your caption<textarea required rows={10} maxLength={input.platform==='instagram'?2200:10000} value={input.caption} onChange={event=>setInput(previous=>({...previous,caption:event.target.value}))} placeholder="Tell a story worth a little tail wag…"/><span className={a.counter}><small>Write naturally. Keep your product details accurate.</small><small>{input.caption.length.toLocaleString()} / {input.platform==='instagram'?'2,200':'10,000'}</small></span></label>
          <div className={a.mediaChoice}>{input.mediaSrc?<img src={input.mediaSrc} alt={input.mediaAlt}/>:<AdminIcon name="image" size={28}/>}<div><strong>{input.mediaSrc?'Your chosen photo':'A picture for your post'}</strong><small>{input.platform==='instagram'?'Instagram: one JPEG under 8 MB, with an aspect ratio from 4:5 to 1.91:1.':'Add a photo, or let your words tell the story.'}</small><div className={a.actions} style={{marginTop:3}}><button type="button" className={s.textButton} onClick={()=>setMediaOpen(true)}>{input.mediaSrc?'Change photo':'Choose from media library'} →</button>{input.mediaSrc&&<button type="button" className={s.textButton} onClick={()=>setInput(previous=>({...previous,mediaSrc:'',mediaAlt:''}))}>Remove</button>}</div></div></div>
          {input.mediaSrc&&<label>Describe the photo<input maxLength={300} value={input.mediaAlt} onChange={event=>setInput(previous=>({...previous,mediaAlt:event.target.value}))}/></label>}
          <small>Choose brand-owned media already used in published website content. Community member photos keep their own sharing permissions and are managed separately.</small>
        </fieldset>
        {selected?.error&&<div className={s.error} style={{marginTop:20}} role="alert">{selected.error}</div>}
        {!connection?.configured&&!locked&&<div className={a.setupNote}><AdminIcon name="link" size={17}/><p>{platformName(input.platform)} is not connected yet. Save your draft now and <button type="button" onClick={()=>chooseTab('connections')}>complete the connection</button> before publishing.</p></div>}
        <div className={a.actions}>{!locked&&<><button type="submit" className={s.secondary} disabled={!!busy||manualRecovery}><AdminIcon name="save"/>{busy==='save'?'Saving…':'Save draft'}</button><button type="button" className={s.primary} disabled={!!busy||!publishable} onClick={()=>{publishRequest.current=crypto.randomUUID();setConfirmPublish(true);}}>Review & publish<AdminIcon name="arrow"/></button></>}{selected?.publishedUrl&&<a className={s.primary} href={selected.publishedUrl} target="_blank" rel="noopener noreferrer">View published post<AdminIcon name="arrow"/></a>}{selected&&(selected.status==='uncertain'||selected.status==='publishing')&&<button type="button" className={s.secondary} disabled={!!busy} onClick={refreshPublication}>{busy==='refresh'?'Checking…':'Check publication status'}</button>}</div>
        {manualRecovery&&<p className={s.note}>The last save could not be confirmed. Recover it before saving again to avoid creating a duplicate draft.</p>}
        {draftDirty&&selected&&<p className={s.note}>Save your changes before reviewing this post for publication.</p>}
        {selected&&(selected.status==='uncertain'||selected.status==='publishing')&&<p className={s.note}>The platform has not confirmed the final result yet. Check the connected account before creating another post.</p>}
        </form><aside><span className={s.eyebrow}>YOUR SOCIAL PREVIEW</span><div className={a.previewCard}><div className={a.previewIdentity}><span className={a.avatar}>{brand==='quipaw'?'Q':'F'}</span><div><strong>{name}</strong><small>{platformName(input.platform)} · Post preview</small></div></div>{(input.mediaSrc||input.platform==='instagram')&&<div className={a.previewMedia}>{input.mediaSrc?<img src={input.mediaSrc} alt={input.mediaAlt}/>:<AdminIcon name="image" size={35}/>}</div>}<p className={a.previewCaption}>{input.caption||'Your words, a little personality, and a moment worth sharing.'}</p></div><p className={s.note}>The platform may crop photos or format text differently. Review your selected photo before sharing.</p></aside></div>
      </section>)}
      {tab==='connections'&&<>
        <div className={a.intro}><div><span className={s.eyebrow}>A PLACE FOR EVERY STORY</span><h2>Connect once. <em>Create together.</em></h2><p>Your site, your AI account and your brand’s social channels. Each connection belongs to this brand.</p></div><span className={a.introMark}><AdminIcon name="link" size={40}/></span></div>
        <div className={a.connections}>
          <article className={a.connection}><div className={a.connectionHead}><span className={a.connectionMark}><AdminIcon name="sparkles"/></span><span className={a.status} data-ready={status?.ai.configured}><i/>{status?.ai.configured?'Configuration saved':'Setup needed'}</span></div><h3>AI writing</h3><p>Blog and social drafts grounded in your saved product information.</p><ol><li>Use an OpenAI API project with billing enabled.</li><li>Add its API key and model to this site’s server configuration.</li><li>Create a draft, review it, then publish when ready.</li></ol>{status?.ai.model&&<p>Model: <strong>{status.ai.model}</strong></p>}<details><summary>Setup details for your developer</summary><div>{(status?.ai.missing.length?status.ai.missing:['OPENAI_API_KEY','OPENAI_MODEL']).map(key=><code key={key}>{key}</code>)}<span>Enter credentials in Vercel’s server environment settings, then redeploy. Never paste them into a post.</span></div></details><a href="https://platform.openai.com/settings/organization/api-keys" target="_blank" rel="noopener noreferrer">Open OpenAI settings ↗</a></article>
          {(['facebook','instagram'] as const).map(channel=>{const current=status?.[channel];return <article key={channel} className={a.connection}><div className={a.connectionHead}><span className={a.connectionMark}>{channel==='facebook'?'f':<AdminIcon name="image"/>}</span><span className={a.status} data-ready={current?.verified}><i/>{current?.verified?'Verified':current?.configured?'Configuration saved':'Setup needed'}</span></div><h3>{platformName(channel)}</h3><p>{channel==='facebook'?'Share text and single-photo posts on your Facebook Page.':'Share single JPEG photos on your professional Instagram account.'}</p><ol><li>{channel==='facebook'?'Connect your brand’s Facebook Page through a Meta app.':'Link your professional Instagram account to the brand’s Facebook Page.'}</li><li>Grant the app the publishing permissions for this brand.</li><li>Save the account connection in the site’s server settings.</li></ol>{current?.accountId&&<p>Account reference: <strong>{current.accountId}</strong></p>}{current?.note&&<p>{current.note}</p>}<details><summary>Setup details for your developer</summary><div>{current?.missing.map(key=><code key={key}>{key}</code>)}<span>Credentials stay on the server. Meta may require app review and business verification before publishing for client accounts.</span><span>Initial publishing supports single-photo posts{channel==='facebook'?' and text posts':''}. Videos, Reels and scheduling are not enabled.</span></div></details><a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">Open Meta Business Suite ↗</a></article>;})}
        </div><div className={a.setupNote}><AdminIcon name="check" size={18}/><p>A saved configuration is checked by the platform when publishing. Your draft is published only after you review the post and choose “Publish now”.</p></div><div><button className={s.secondary} onClick={refresh}>Refresh connection status</button></div>
      </>}
    </>}
    {mediaOpen&&<AdminMediaDialog imagesOnly onClose={()=>setMediaOpen(false)} onChoose={pickMedia}/>}
    {confirmPublish&&selected&&<PublishDialog draft={selected} account={connection?.accountId||name} onClose={()=>setConfirmPublish(false)} onPublish={publish} busy={busy==='publish'}/>}
  </section>;
}
