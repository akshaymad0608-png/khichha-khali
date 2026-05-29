import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useSettings } from '../settings/useSettings.js';
import './SettingsBar.css';

export default function SettingsBar() {
  const { t } = useLanguage();
  const { settings, toggle } = useSettings();

  return (
    <div className="settings-bar" role="region" aria-label={t('settings')}>
      <label className="setting-toggle">
        <input
          type="checkbox"
          checked={settings.simpleMode}
          onChange={() => toggle('simpleMode')}
        />
        <span className="setting-box" />
        <span>
          <strong>{t('simpleMode')}</strong>
          <small>{t('simpleModeHint')}</small>
        </span>
      </label>
      <label className="setting-toggle">
        <input
          type="checkbox"
          checked={settings.largeText}
          onChange={() => toggle('largeText')}
        />
        <span className="setting-box" />
        <span>
          <strong>{t('largeText')}</strong>
          <small>{t('largeTextHint')}</small>
        </span>
      </label>
      <label className="setting-toggle">
        <input
          type="checkbox"
          checked={settings.lightTheme}
          onChange={() => toggle('lightTheme')}
        />
        <span className="setting-box" />
        <span>
          <strong>{settings.lightTheme ? t('lightTheme') : t('darkTheme')}</strong>
          <small>{t('themeHint')}</small>
        </span>
      </label>
    </div>
  );
}
