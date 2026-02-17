import type { ThemeTokens } from './types'

const fontStack = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export const sofiaTokens: ThemeTokens = {
  name: 'sofia',
  displayName: 'Sofia Core',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      gradient: {
        from: '#e0f2fe',
        via: '#bfdbfe',
        to: '#c7d2fe',
      },
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      muted: '#94a3b8',
    },
    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
    },
  },
  typography: {
    fontFamily: fontStack,
    scale: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
  },
  spacing: {
    unit: 4,
    scale: {
      none: 0,
      '0.5': 2,
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
      '4xl': 40,
      '5xl': 48,
    },
  },
  elevation: {
    level0: 'none',
    level1: '0 1px 2px rgba(15, 23, 42, 0.06)',
    level2: '0 3px 6px rgba(15, 23, 42, 0.08)',
    level3: '0 8px 12px rgba(15, 23, 42, 0.1)',
    level4: '0 18px 28px rgba(15, 23, 42, 0.12)',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    pill: 999,
  },
}

export const themeTokens = {
  sofia: sofiaTokens,
}

export type ThemeName = keyof typeof themeTokens
