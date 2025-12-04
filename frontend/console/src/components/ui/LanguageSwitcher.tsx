/**
 * Language switcher component.
 */
import { useTranslation, useLanguages } from '@/i18n/hooks'

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useTranslation()
  const languages = useLanguages()

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
      className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}

