import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LANG_STORAGE_KEY,
  LANGUAGES,
  messages,
  interpolate,
  CATEGORY_IDS,
  PAYMENT_IDS,
  SORT_IDS,
} from './translations.js';

const LanguageContext = createContext(null);

function loadLang() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (saved && messages[saved]) return saved;
  const browser = navigator.language?.slice(0, 2);
  if (browser && messages[browser]) return browser;
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang);

  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-IN';
  const dict = messages[lang] ?? messages.en;

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    function t(key, vars) {
      const val = dict[key];
      if (typeof val === 'string') return interpolate(val, vars);
      return key;
    }

    function tCategory(id) {
      const item = CATEGORY_IDS.find((c) => c.id === id) ?? CATEGORY_IDS.at(-1);
      return { ...item, label: dict.categories[item.id] ?? item.id };
    }

    function tPayment(id) {
      const item = PAYMENT_IDS.find((p) => p.id === id) ?? PAYMENT_IDS[0];
      return { ...item, label: dict.payments[item.id] ?? item.id };
    }

    function tSort(id) {
      return { id, label: dict.sort[id] ?? id };
    }

    function formatDate(iso) {
      return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    function formatMonth(year, month) {
      return new Date(Number(year), Number(month) - 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
    }

    function formatWeekday(date) {
      return date.toLocaleDateString(locale, { weekday: 'short' });
    }

    return {
      lang,
      locale,
      setLang: setLangState,
      languages: LANGUAGES,
      t,
      tCategory,
      tPayment,
      tSort,
      formatDate,
      formatMonth,
      formatWeekday,
      categories: CATEGORY_IDS,
      payments: PAYMENT_IDS,
      sortOptions: SORT_IDS,
      csvHeader: dict.csvHeader,
      favorites: dict.favorites ?? messages.en.favorites,
    };
  }, [lang, locale, dict]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
