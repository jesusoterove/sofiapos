/**
 * i18n hooks for sofia-ui components.
 */
import { useTranslation as useI18nTranslation } from 'react-i18next'
import { useContext, useEffect } from 'react'
import { LanguageContext } from '../contexts/LanguageContext'

/**
 * Custom hook for translations in sofia-ui.
 * Uses LanguageContext if provided, otherwise uses i18next directly.
 */
export function useTranslation() {
  const languageContext = useContext(LanguageContext)
  const i18nTranslation = useI18nTranslation()
  
  // If LanguageContext is provided, sync i18next language with context
  useEffect(() => {
    if (languageContext && i18nTranslation.i18n.language !== languageContext.language) {
      i18nTranslation.i18n.changeLanguage(languageContext.language)
    }
  }, [languageContext?.language, i18nTranslation.i18n])
  
  return {
    t: i18nTranslation.t,
    i18n: i18nTranslation.i18n,
    currentLanguage: languageContext?.language || i18nTranslation.i18n.language,
    changeLanguage: (lang: string) => {
      if (languageContext?.changeLanguage) {
        languageContext.changeLanguage(lang)
      } else {
        i18nTranslation.i18n.changeLanguage(lang)
      }
    },
    isEnglish: (languageContext?.language || i18nTranslation.i18n.language) === 'en',
    isSpanish: (languageContext?.language || i18nTranslation.i18n.language) === 'es',
  }
}

