/**
 * Internationalization setup for Sofia UI Component Library.
 * This file initializes a fallback i18n instance for sofia-ui components.
 * Applications should merge sofia-ui translations into their own i18n instance.
 * 
 * @see ./translations.ts for exporting translations to be merged
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import enTranslations from './locales/en/translation.json'
import esTranslations from './locales/es/translation.json'

// Initialize a fallback i18next instance for sofia-ui
// This is used when no LanguageContext is provided or when components
// need to work standalone. Applications should merge translations instead.
i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Base language (English)
    lng: 'en',
    
    // Fallback language
    fallbackLng: 'en',
    
    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Debug mode (disabled by default)
    debug: false,
    
    // Resources (translations)
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  })

export default i18n

