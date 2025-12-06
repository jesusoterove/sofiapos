/**
 * Theme context for managing application themes.
 * Supports multiple color palettes and easy theme switching.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Theme as AgGridThemeType } from 'ag-grid-community'
import { agGridSunshineTheme } from './agGridThemes'

// Type for ag-grid theme (returned by themeQuartz.withParams())
export type AgGridTheme = AgGridThemeType

export interface ThemeColors {
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  background: {
    default: string
    paper: string
    gradient: {
      from: string
      via: string
      to: string
    }
  }
  text: {
    primary: string
    secondary: string
    muted: string
  }
  border: {
    default: string
    light: string
  }
}

export interface Theme {
  name: string
  displayName: string
  colors: ThemeColors
  agGridTheme: AgGridTheme
}

// Sunshine theme (yellow palette from login page)
export const sunshineTheme: Theme = {
  name: 'sunshine',
  displayName: 'Sunshine',
  agGridTheme: agGridSunshineTheme,
  colors: {
    primary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      gradient: {
        from: '#fbbf24', // yellow-400
        via: '#fde68a', // yellow-300
        to: '#f59e0b', // yellow-500
      },
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#4b5563', // gray-600
      muted: '#9ca3af', // gray-400
    },
    border: {
      default: '#e5e7eb', // gray-200
      light: '#f3f4f6', // gray-100
    },
  },
}

// Future themes can be added here
export const themes: Record<string, Theme> = {
  sunshine: sunshineTheme,
  // Add more themes here in the future:
  // ocean: oceanTheme,
  // forest: forestTheme,
  // etc.
}

interface ThemeContextType {
  currentTheme: Theme
  themeName: string
  setTheme: (themeName: string) => void
  availableThemes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_THEME = 'sunshine'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<string>(() => {
    // Load theme from localStorage or use default
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || DEFAULT_THEME
    }
    return DEFAULT_THEME
  })

  const currentTheme = themes[themeName] || themes[DEFAULT_THEME]
  const availableThemes = Object.values(themes)

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeNameState(newThemeName)
      localStorage.setItem('theme', newThemeName)
      
      // Apply theme CSS variables to document root
      applyThemeToDocument(themes[newThemeName])
    }
  }

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyThemeToDocument(currentTheme)
  }, [currentTheme])

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeName,
        setTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Apply theme colors as CSS variables to the document root.
 */
function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  
  // Primary colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value)
  })

  // Background colors
  root.style.setProperty('--color-bg-default', theme.colors.background.default)
  root.style.setProperty('--color-bg-paper', theme.colors.background.paper)
  root.style.setProperty('--color-bg-gradient-from', theme.colors.background.gradient.from)
  root.style.setProperty('--color-bg-gradient-via', theme.colors.background.gradient.via)
  root.style.setProperty('--color-bg-gradient-to', theme.colors.background.gradient.to)

  // Text colors
  root.style.setProperty('--color-text-primary', theme.colors.text.primary)
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
  root.style.setProperty('--color-text-muted', theme.colors.text.muted)

  // Border colors
  root.style.setProperty('--color-border-default', theme.colors.border.default)
  root.style.setProperty('--color-border-light', theme.colors.border.light)

  // Add theme class to body for easy styling
  document.body.className = document.body.className.replace(/theme-\w+/g, '')
  document.body.classList.add(`theme-${theme.name}`)
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

