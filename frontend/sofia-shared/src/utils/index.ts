const DEFAULT_LOCALE = 'es-ES'
const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  'es-es': 'es-ES',
  en: 'en-US',
  'en-us': 'en-US',
}

type NullableString = string | null | undefined

const getGlobalObject = (): any => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  return {}
}

const getWindowLike = (): any => {
  const globalObj = getGlobalObject()
  return globalObj.window ?? globalObj
}

const normalizeLocale = (candidate?: NullableString): string | null => {
  if (!candidate) return null
  const normalized = candidate.toLowerCase()
  return LOCALE_MAP[normalized] ?? candidate
}

const readFromLocalStorage = (key: string): string | null => {
  const windowLike = getWindowLike()
  const storage = windowLike?.localStorage
  if (!storage?.getItem) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

const detectLocaleFromRuntime = (): string | null => {
  const globalObj = getGlobalObject()
  const windowLike = getWindowLike()

  const i18nextLang = windowLike?.i18next?.language as NullableString ?? globalObj?.i18next?.language
  if (i18nextLang) return normalizeLocale(i18nextLang)

  const stored = readFromLocalStorage('i18nextLng') || readFromLocalStorage('pos_language')
  if (stored) return normalizeLocale(stored)

  const navigatorLang = windowLike?.navigator?.language as NullableString ?? globalObj?.navigator?.language
  if (navigatorLang) return normalizeLocale(navigatorLang)

  return null
}

const resolveLocale = (explicit?: NullableString): string => {
  return normalizeLocale(explicit) || detectLocaleFromRuntime() || DEFAULT_LOCALE
}

export interface FormatCurrencyOptions extends Intl.NumberFormatOptions {
  locale?: string
  currency?: string
}

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: string
}

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string
}

export const formatCurrency = (value: number, options: FormatCurrencyOptions = {}): string => {
  const { locale, currency = 'USD', ...rest } = options
  const resolvedLocale = resolveLocale(locale)

  const formatter = new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...rest,
  })

  return formatter.format(value)
}

export const formatNumber = (value: number, options: FormatNumberOptions = {}): string => {
  const { locale, ...rest } = options
  const formatter = new Intl.NumberFormat(resolveLocale(locale), rest)
  return formatter.format(value)
}

const coerceDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isNaN(dateObj.getTime()) ? null : dateObj
}

export const formatDate = (
  date: string | Date | null | undefined,
  options: FormatDateOptions = {}
): string => {
  const dateObj = coerceDate(date)
  if (!dateObj) return '-'
  const { locale, ...rest } = options
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...rest,
  })
  return formatter.format(dateObj)
}

export const formatTime = (
  date: string | Date | null | undefined,
  options: FormatDateOptions = {}
): string => {
  const dateObj = coerceDate(date)
  if (!dateObj) return '-'
  const { locale, ...rest } = options
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    ...rest,
  })
  return formatter.format(dateObj)
}

export const formatDateTime = (
  date: string | Date | null | undefined,
  options: FormatDateOptions = {}
): string => {
  const dateObj = coerceDate(date)
  if (!dateObj) return '-'
  const { locale, ...rest } = options
  const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...rest,
  })
  return formatter.format(dateObj)
}

export const formatDateTimeWithSeconds = (
  date: string | Date | null | undefined,
  options: FormatDateOptions = {}
): string => {
  return formatDateTime(date, {
    second: '2-digit',
    ...options,
  })
}

export const getResolvedLocale = resolveLocale
