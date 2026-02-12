/**
 * i18n hooks for easy translation access.
 * changeLanguage persists to localStorage so the user's choice survives reload.
 */
import { useTranslation as useI18nTranslation } from 'react-i18next'
import { setPersistedLanguage } from './index'

export function useTranslation() {
  const { t, i18n } = useI18nTranslation()

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: (lang: string) => setPersistedLanguage(lang),
    isEnglish: i18n.language === 'en',
    isSpanish: i18n.language === 'es',
  }
}

/**
 * Hook to get available languages.
 */
export function useLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
  ]
}

