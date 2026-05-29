import { useLanguage } from '../i18n/LanguageContext.jsx';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useLanguage();

  return (
    <div className="lang-switcher" role="group" aria-label={t('language')}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          title={l.name}
          aria-pressed={lang === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
