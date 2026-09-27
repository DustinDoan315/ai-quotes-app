import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import vi from './locales/vi.json';

export type SupportedUiLanguage = 'en' | 'vi';

export const getDeviceUiLanguage = (): SupportedUiLanguage => {
  const locale = Localization.getLocales()[0];
  const languageCode = (locale?.languageCode ?? locale?.languageTag ?? 'en')
    .split(/[-_]/)[0]
    .toLowerCase();

  return languageCode === 'vi' ? 'vi' : 'en';
};

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: getDeviceUiLanguage(),
  supportedLngs: ['en', 'vi'],
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
