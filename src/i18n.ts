import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhTranslation from '@data/locales/zh/translation.json';
import enTranslation from '@data/locales/en/translation.json';
const resources = {
  zh: { translation: zhTranslation },
  en: { translation: enTranslation },
};
i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;