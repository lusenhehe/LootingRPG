import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// simple file loader; Vite can import JSON directly
import zhTranslation from './locales/zh/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  zh: { translation: zhTranslation },
  en: { translation: enTranslation },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;