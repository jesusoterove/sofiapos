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
      className="w-full px-4 py-2 border rounded-lg text-sm"
      style={{
        borderColor: 'var(--color-border-default)',
        backgroundColor: 'var(--color-bg-paper)',
        color: 'var(--color-text-primary)',
      }}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}

