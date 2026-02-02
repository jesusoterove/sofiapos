/**
 * Internationalization setup for POS application.
 *
 * i18nextLng rule: only READ on app start; only WRITE when user explicitly selects language (e.g. during registration).
 * - Detection: we read localStorage first (i18nextLng), then navigator, then htmlTag. No lng set so detector decides.
 * - caches: [] so the detector NEVER writes to localStorage on init or on changeLanguage. We persist only in the
 *   registration flow when the user selects a language (see setPersistedLanguage).
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en/translation.json'
import esTranslations from './locales/es/translation.json'

const I18N_LNG_KEY = 'i18nextLng'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    debug: import.meta.env.DEV,
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: I18N_LNG_KEY,
      // Do not cache: we never write i18nextLng on start or from detector. Only registration flow writes.
      caches: [],
    },
    react: { useSuspense: false },
  })

/**
 * Call this when the user explicitly selects a language (e.g. during registration).
 * This is the only place that should write to i18nextLng.
 */
export function setPersistedLanguage(lang: string): void {
  if (lang !== 'en' && lang !== 'es') return
  if (typeof window !== 'undefined') {
    localStorage.setItem(I18N_LNG_KEY, lang)
  }
  i18n.changeLanguage(lang)
}

export default i18n

