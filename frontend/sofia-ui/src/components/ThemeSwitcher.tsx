/**
 * Theme switcher component.
 * Allows users to switch between available themes.
 */
import { useTheme } from '../theme/ThemeContext'

export function ThemeSwitcher() {
  const { currentTheme, setTheme, availableThemes } = useTheme()

  return (
    <select
      value={currentTheme.name}
      onChange={(e) => setTheme(e.target.value)}
      className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
      style={{
        borderColor: 'var(--color-border-default)',
      }}
    >
      {availableThemes.map((theme) => (
        <option key={theme.name} value={theme.name}>
          {theme.displayName}
        </option>
      ))}
    </select>
  )
}

