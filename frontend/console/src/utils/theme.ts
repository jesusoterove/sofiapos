/**
 * Theme utility functions.
 */

import { ThemeColors } from '@/contexts/ThemeContext'

/**
 * Get a theme color by key.
 * @param colors - Theme colors object
 * @param key - Color key (e.g., 'primary.500', 'text.primary')
 * @returns Color value or fallback
 */
export function getThemeColor(colors: ThemeColors, key: string): string {
  const keys = key.split('.')
  let value: any = colors
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }
  
  return value || '#000000'
}

/**
 * Get CSS variable name for a theme color.
 * @param key - Color key (e.g., 'primary.500', 'text.primary')
 * @returns CSS variable name (e.g., '--color-primary-500')
 */
export function getThemeCSSVar(key: string): string {
  return `--color-${key.replace('.', '-')}`
}

/**
 * Apply theme color as inline style.
 * @param key - Color key
 * @param property - CSS property name (default: 'color')
 * @returns Style object
 */
export function themeStyle(key: string, property: string = 'color'): Record<string, string> {
  return {
    [property]: `var(${getThemeCSSVar(key)})`,
  }
}

