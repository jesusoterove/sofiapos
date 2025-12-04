/**
 * i18n hooks for easy translation access.
 */
import { useTranslation as useI18nTranslation } from 'react-i18next'

/**
 * Custom hook for translations.
 * Provides convenient access to translation function and current language.
 * 
 * @example
 * ```tsx
 * const { t, i18n } = useTranslation()
 * 
 * return (
 *   <div>
 *     <h1>{t('dashboard.title')}</h1>
 *     <button onClick={() => i18n.changeLanguage('es')}>
 *       {t('common.changeLanguage')}
 *     </button>
 *   </div>
 * )
 * ```
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation()
  
  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: (lang: string) => i18n.changeLanguage(lang),
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

