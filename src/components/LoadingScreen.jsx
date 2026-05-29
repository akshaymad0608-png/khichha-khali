import { useLanguage } from '../i18n/LanguageContext.jsx';
import './LoadingScreen.css';

export default function LoadingScreen() {
  const { t } = useLanguage();

  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{t('loadingData')}</p>
    </div>
  );
}
