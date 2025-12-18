/**
 * Date formatting utilities.
 * Uses the current language from i18n for consistent formatting across the app.
 */

/**
 * Get the current locale from i18n or default to 'es-ES'
 */
function getCurrentLocale(): string {
  // Try to get from i18n if available (in browser context)
  if (typeof window !== 'undefined') {
    try {
      // Check if i18next is available
      const i18n = (window as any).i18next
      if (i18n?.language) {
        // Map language codes to locales
        if (i18n.language === 'en') return 'en-US'
        if (i18n.language === 'es') return 'es-ES'
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('i18nextLng') || localStorage.getItem('pos_language')
      if (stored) {
        if (stored.startsWith('en')) return 'en-US'
        if (stored.startsWith('es')) return 'es-ES'
      }
    } catch {
      // Ignore errors
    }
  }
  
  return 'es-ES' // Default to Spanish
}

/**
 * Format a date string or Date object to a localized date string.
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    
    const locale = getCurrentLocale()
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options,
    }
    
    return dateObj.toLocaleDateString(locale, defaultOptions)
  } catch {
    return '-'
  }
}

/**
 * Format a date string or Date object to a localized time string.
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted time string
 */
export function formatTime(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    
    const locale = getCurrentLocale()
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }
    
    return dateObj.toLocaleTimeString(locale, defaultOptions)
  } catch {
    return '-'
  }
}

/**
 * Format a date string or Date object to a localized date and time string.
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return '-'
    
    const locale = getCurrentLocale()
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }
    
    return dateObj.toLocaleString(locale, defaultOptions)
  } catch {
    return '-'
  }
}

/**
 * Format a date string or Date object to a full date and time string with seconds.
 * @param date - Date string or Date object
 * @returns Formatted date and time string with seconds
 */
export function formatDateTimeWithSeconds(
  date: string | Date | null | undefined
): string {
  return formatDateTime(date, {
    second: '2-digit',
  })
}

