/**
 * Internationalization setup for Console application.
 *
 * i18nextLng rule: only READ on app start; only WRITE when user explicitly selects language (e.g. in Settings).
 * - Do not set lng in init: let the detector read localStorage first so user's choice is used.
 * - caches: [] so the detector never writes to localStorage (no overwrite on reload).
 * - When user changes language (LanguageSwitcher), use setPersistedLanguage so the choice persists.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en/translation.json'
import esTranslations from './locales/es/translation.json'

// Import sofia-ui translations to merge
import { sofiaUiTranslations } from '@sofiapos/ui'

const I18N_LNG_KEY = 'i18nextLng'

// Check localStorage FIRST before any initialization
// This ensures user preference is always respected
let initialLanguage: string | undefined
if (typeof window !== 'undefined') {
  const storedLang = localStorage.getItem(I18N_LNG_KEY)
  if (storedLang === 'en' || storedLang === 'es') {
    initialLanguage = storedLang
  }
}

// Build i18n instance: only use LanguageDetector if no stored preference exists
// This prevents detector from overriding user's stored choice
let i18nBuilder = i18n
if (!initialLanguage) {
  // Only use LanguageDetector when we don't have a stored preference
  i18nBuilder = i18nBuilder.use(LanguageDetector)
}
i18nBuilder = i18nBuilder.use(initReactI18next)

i18nBuilder.init({
  // If we have a stored language, use it directly - no detector will run
  // Otherwise, let detector find language, then fallback to default
  lng: initialLanguage,
  fallbackLng: import.meta.env.DEV ? 'es' : 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  debug: import.meta.env.DEV,
  resources: {
    en: {
      translation: {
        ...sofiaUiTranslations.en,
        ...enTranslations,
      },
    },
    es: {
      translation: {
        ...sofiaUiTranslations.es,
        ...esTranslations,
      },
    },
  },
  interpolation: { escapeValue: false },
  detection: initialLanguage ? undefined : {
    // Only configure detection if no stored language exists
    order: ['localStorage', 'navigator', 'htmlTag'],
    lookupLocalStorage: I18N_LNG_KEY,
    // Do not cache: we only write when user selects language in LanguageSwitcher
    caches: [],
  },
  react: { useSuspense: false },
})

/**
 * Call when the user explicitly selects a language (e.g. in Settings).
 * This is the only place that should write to i18nextLng so the choice persists on reload.
 */
export function setPersistedLanguage(lang: string): void {
  if (lang !== 'en' && lang !== 'es') return
  if (typeof window !== 'undefined') {
    localStorage.setItem(I18N_LNG_KEY, lang)
  }
  i18n.changeLanguage(lang)
}

export default i18n

