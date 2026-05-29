import { useLanguage } from '../i18n/LanguageContext.jsx';
import { markOnboarded } from '../settings/useSettings.js';
import './Onboarding.css';

export default function Onboarding({ onDone }) {
  const { t } = useLanguage();

  const steps = [
    { icon: '👆', title: t('onboard1Title'), text: t('onboard1Text') },
    { icon: '⚡', title: t('onboard2Title'), text: t('onboard2Text') },
    { icon: '🔒', title: t('onboard3Title'), text: t('onboard3Text') },
  ];

  function finish() {
    markOnboarded();
    onDone();
  }

  return (
    <div className="onboard-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboard-card">
        <h2 id="onboard-title">KHALI KHICHHA</h2>
        <p className="onboard-welcome">{t('onboardWelcome')}</p>
        <ul className="onboard-steps">
          {steps.map((s) => (
            <li key={s.title}>
              <span className="onboard-icon" aria-hidden="true">
                {s.icon}
              </span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="onboard-actions">
          <button type="button" className="btn-secondary" onClick={finish}>
            {t('skip')}
          </button>
          <button type="button" className="btn-primary" onClick={finish}>
            {t('getStarted')}
          </button>
        </div>
      </div>
    </div>
  );
}
