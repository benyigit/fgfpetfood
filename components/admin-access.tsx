'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminIcon } from './admin-icons';
import s from './admin-studio.module.css';
export function AdminAccess({brand,denied=false,unavailable=false,name=''}:{brand:'quipaw'|'fgfpetfood';denied?:boolean;unavailable?:boolean;name?:string}) {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const label=brand==='quipaw'?'Quipaw':'FGF Pet Food Bazaar';
  async function login(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');const form=new FormData(event.currentTarget);
    try {const response=await fetch('/api/community/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'login',email:form.get('email'),password:form.get('password')})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Please try again.');router.refresh();}
    catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{setBusy(false);}
  }
  async function signOut(){setBusy(true);setError('');try{const response=await fetch('/api/community/auth',{method:'DELETE'});if(!response.ok)throw new Error('Please try again.');router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'Please try again.');}finally{setBusy(false);}}
  return <main className={s.access} data-brand={brand}><div className={s.accessStory}><Link href="/" className={s.logo}><img src={brand==='quipaw'?'/assets/logo-quipaw.png':'/assets/logo-fgf.webp'} alt={label}/></Link><span className={s.eyebrow}>THE BRAND STUDIO</span><h1>A little care.<br/><em>A lot of happy tails.</em></h1><p>Your space for good stories, beautiful products and the people who love them.</p><div className={s.accessArt}><span>✿</span><img src={brand==='quipaw'?'/assets/stories/quipaw-calm-cavalier-hero.webp':'/assets/stories/fgf-golden-cocker-hero.webp'} alt="A happy dog enjoying treat time"/><span>Good things<br/>start here.</span></div></div><section className={s.accessCard}>
    <span className={s.accessMark}><AdminIcon name={denied?'product':'article'} size={28}/></span><p className={s.eyebrow}>{label} · CONTENT MANAGEMENT</p><h2>{unavailable?'We’ll be right back.':denied?'Your studio access.':'Welcome back.'}</h2>
    {unavailable?<><p>We could not connect to your account right now. Please try again shortly.</p><button className={s.primary} onClick={()=>router.refresh()}>Try again <AdminIcon name="arrow"/></button></>:denied?<><p>You are signed in{name?` as ${name}`:''}. This account has not been given site administrator access yet.</p><p className={s.note}>The site owner can approve access for this account. Community photo permissions are managed separately.</p><button className={s.secondary} disabled={busy} onClick={signOut}>Use another account <AdminIcon name="logout"/></button></>:<><p>Sign in with your approved brand administrator account.</p><form className={s.loginForm} onSubmit={login}><label>Email address<input type="email" name="email" autoComplete="username" required placeholder="you@example.com"/></label><label>Password<input type="password" name="password" autoComplete="current-password" required minLength={10} maxLength={128}/></label><button className={s.primary} disabled={busy}>{busy?'Signing in…':'Open the studio'}<AdminIcon name="arrow"/></button></form></>}
    {error&&<p role="alert" className={s.error}>{error}</p>}<Link className={s.back} href="/">← Back to {label}</Link>
  </section></main>;
}
