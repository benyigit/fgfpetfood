'use client';
import { consentCopy, socialConsentCopy } from '@/lib/community-consent';
import s from './member.module.css';
export function SharingChoices({ website, social, onWebsite, onSocial, disabled = false }: {
  website: boolean; social: boolean; onWebsite: (value: boolean) => void; onSocial: (value: boolean) => void; disabled?: boolean;
}) {
  return <fieldset className={s.sharingChoices} disabled={disabled}>
    <legend>Your moment. Your choice.</legend>
    <p>Both permissions are optional. Choose either, both, or keep this memory just for you.</p>
    <label className={s.permissionChoice}><input type="checkbox" checked={website} onChange={e => onWebsite(e.target.checked)} /><span><strong>Share on this website</strong><span>{consentCopy.en}</span></span><span className={s.permissionIcon} aria-hidden="true">♡</span></label>
    <label className={s.permissionChoice}><input type="checkbox" checked={social} onChange={e => onSocial(e.target.checked)} /><span><strong>May we share it on our social media?</strong><span>{socialConsentCopy.en}</span></span><span className={s.permissionIcon} aria-hidden="true">↗</span></label>
    <small>You can change these choices in your album. Withdrawing website permission removes the photo from our gallery immediately. Withdrawing social permission stops future use and alerts the team to remove its earlier posts; copies shared by other people may remain.</small>
  </fieldset>;
}
