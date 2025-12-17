import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';

// Verificar se localStorage está disponível (browser only)
const getSavedLanguage = (): string => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem('language') || 'pt';
    } catch {
      return 'pt';
    }
  }
  return 'pt';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: ptTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    lng: getSavedLanguage(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
