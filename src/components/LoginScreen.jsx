import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import './LoginScreen.css';

export default function LoginScreen() {
  const { t } = useLanguage();
  const { signInWithGoogle, error, clearError } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    clearError();
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      /* error set in context */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-logo" aria-hidden="true">
          🪙
        </span>
        <h1>KHALI KHICHHA</h1>
        <p className="login-title">{t('loginTitle')}</p>
        <p className="login-subtitle">{t('loginSubtitle')}</p>

        <button
          type="button"
          className="google-btn"
          onClick={handleSignIn}
          disabled={busy}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {busy ? t('signingIn') : t('signInGoogle')}
        </button>

        {error && <p className="login-error">{error}</p>}

        <div className="login-lang">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
