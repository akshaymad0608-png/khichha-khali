import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import './UserMenu.css';

export default function UserMenu({ syncStatus }) {
  const { user, isConfigured, signInWithGoogle, signOut } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      /* auth context */
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    if (!isConfigured) return null;
    return (
      <button
        type="button"
        className="header-signin"
        onClick={handleSignIn}
        disabled={busy}
      >
        {busy ? t('signingIn') : t('signInShort')}
      </button>
    );
  }

  const syncLabel =
    syncStatus === 'syncing'
      ? t('syncing')
      : syncStatus === 'error'
        ? t('syncError')
        : syncStatus === 'synced'
          ? t('synced')
          : null;

  return (
    <div className="user-menu">
      {syncLabel && (
        <span
          className={`sync-badge ${syncStatus === 'error' ? 'error' : ''}`}
          title={syncLabel}
        >
          {syncStatus === 'syncing' ? '◌' : syncStatus === 'error' ? '!' : '✓'}
        </span>
      )}
      <button
        type="button"
        className="user-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="user-avatar" />
        ) : (
          <span className="user-avatar placeholder">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </span>
        )}
        <span className="user-name">{user.displayName?.split(' ')[0] || 'You'}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="user-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="user-dropdown">
            <p className="user-email">{user.email}</p>
            <button
              type="button"
              className="user-signout"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              {t('signOut')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
