/**
 * Theme switcher component.
 * Allows users to switch between available themes.
 */
import { useTheme } from '@sofiapos/ui'

export function ThemeSwitcher() {
  const { currentTheme, setTheme, availableThemes } = useTheme()

  return (
    <select
      value={currentTheme.name}
      onChange={(e) => setTheme(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg text-sm outline-none"
      style={{
        borderColor: 'var(--color-border-default)',
        backgroundColor: 'var(--color-bg-paper)',
        color: 'var(--color-text-primary)',
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

