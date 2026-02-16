import type { ThemeTokens } from './types'

export const sunshineTokens: ThemeTokens = {
  name: 'sunshine',
  displayName: 'Sunshine',
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
        from: '#fbbf24',
        via: '#fde68a',
        to: '#f59e0b',
      },
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#9ca3af',
    },
    border: {
      default: '#e5e7eb',
      light: '#f3f4f6',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif',
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
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
      '4xl': 40,
    },
  },
  elevation: {
    level0: 'none',
    level1: '0px 1px 2px rgba(15, 23, 42, 0.08)',
    level2: '0px 4px 6px rgba(15, 23, 42, 0.08)',
    level3: '0px 10px 15px rgba(15, 23, 42, 0.1)',
    level4: '0px 20px 25px rgba(15, 23, 42, 0.12)',
  },
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    pill: 999,
  },
}

export const themeTokens = {
  sunshine: sunshineTokens,
}

export type ThemeName = keyof typeof themeTokens
