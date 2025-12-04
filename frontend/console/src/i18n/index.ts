/**
 * Internationalization setup for Console application.
 * English is base language, Spanish is default for development.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en/translation.json'
import esTranslations from './locales/es/translation.json'

// Import sofia-ui translations to merge
import sofiaUiTranslations from '@sofiapos/ui/i18n/translations'

// Development mode: default to Spanish
// Production: detect from browser or use English
const defaultLanguage = import.meta.env.DEV ? 'es' : 'en'

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Base language (English)
    lng: defaultLanguage,
    
    // Fallback language
    fallbackLng: 'en',
    
    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Debug mode (only in development)
    debug: import.meta.env.DEV,
    
    // Resources (translations)
    // Merge sofia-ui translations with console app translations
    resources: {
      en: {
        translation: {
          ...sofiaUiTranslations.en,
          ...enTranslations, // Console app translations override sofia-ui if there are conflicts
        },
      },
      es: {
        translation: {
          ...sofiaUiTranslations.es,
          ...esTranslations, // Console app translations override sofia-ui if there are conflicts
        },
      },
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // Default language if detection fails
      lookupLocalStorage: 'i18nextLng',
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  })

export default i18n

