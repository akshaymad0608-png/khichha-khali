import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './GuestBanner.css';

const DISMISS_KEY = 'khali-khichha-guest-banner-dismissed';

export default function GuestBanner() {
  const { t } = useLanguage();
  const { user, isConfigured, signInWithGoogle } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1'
  );
  const [busy, setBusy] = useState(false);

  if (!isConfigured || user || dismissed) return null;

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      /* handled in auth context */
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="guest-banner" role="region" aria-label={t('localModeHint')}>
      <div className="guest-banner-text">
        <strong>{t('localModeTitle')}</strong>
        <p>{t('localModeHint')}</p>
      </div>
      <div className="guest-banner-actions">
        <button
          type="button"
          className="guest-signin"
          onClick={handleSignIn}
          disabled={busy}
        >
          {busy ? t('signingIn') : t('signInGoogle')}
        </button>
        <button type="button" className="guest-dismiss" onClick={dismiss} aria-label={t('dismiss')}>
          ×
        </button>
      </div>
    </div>
  );
}
