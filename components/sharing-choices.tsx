'use client';
import { consentCopy, socialConsentCopy, socialConsentLabel } from '@/lib/community-consent';
import { useLanguage } from './language-provider';
import s from './member.module.css';
export function SharingChoices({ website, social, onWebsite, onSocial, disabled = false }: {
  website: boolean; social: boolean; onWebsite: (value: boolean) => void; onSocial: (value: boolean) => void; disabled?: boolean;
}) {
  const { t } = useLanguage();
  return <fieldset className={s.sharingChoices} disabled={disabled}>
    <legend>{t('Your moment. Your choice.')}</legend>
    <p>{t('Keep it just for you, share it with everyone, or give the brand permission to share it on social media. You choose each separately.')}</p>
    <label className={s.permissionChoice}><input type="checkbox" checked={website} onChange={e => onWebsite(e.target.checked)} /><span><strong>{t('Show this moment to everyone')}</strong><span>{t(consentCopy.en)}</span></span><span className={s.permissionIcon} aria-hidden="true">♡</span></label>
    <label className={s.permissionChoice}><input type="checkbox" checked={social} onChange={e => onSocial(e.target.checked)} /><span><strong>{t(socialConsentLabel)}</strong><span>{t(socialConsentCopy.en)}</span></span><span className={s.permissionIcon} aria-hidden="true">↗</span></label>
    <p className={s.visibilityNote}>{t(website ? 'This photo will appear in the public scrapbook.' : social ? 'Not in the public scrapbook. The brand team can access it only for the social sharing you allowed.' : 'Just for you: this photo will stay in your private album.')}</p>
    <small>{t('You can change these choices in your album. Withdrawing website permission removes the photo from our gallery immediately. Withdrawing social permission stops future use and alerts the team to remove its earlier posts; copies shared by other people may remain.')}</small>
  </fieldset>;
}
