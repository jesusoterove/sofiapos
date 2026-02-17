import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateTimeWithSeconds,
  getResolvedLocale,
} from '../utils'

describe('formatting helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('formats currency with explicit locale', () => {
    const formatted = formatCurrency(1234.56, { currency: 'EUR', locale: 'es-ES' })
    expect(formatted).toBe(new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(1234.56))
  })

  it('formats numbers using detected locale fallback', () => {
    vi.stubGlobal('navigator', { language: 'en-US' })
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('propagates locale preference from i18next if available', () => {
    vi.stubGlobal('window', { i18next: { language: 'es' } })
    expect(getResolvedLocale()).toBe('es-ES')
  })

  it('formats date/time consistently', () => {
    const input = '2024-05-01T12:34:56Z'
    const options = { timeZone: 'UTC', locale: 'en-US' } as const
    const expectedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date(input))
    const expectedTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(input))
    const expectedDateTime = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(input))
    const expectedWithSeconds = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(input))

    expect(formatDate(input, options)).toBe(expectedDate)
    expect(formatTime(input, options)).toBe(expectedTime)
    expect(formatDateTime(input, options)).toBe(expectedDateTime)
    expect(formatDateTimeWithSeconds(input, options)).toBe(expectedWithSeconds)
  })

  it('returns fallback for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('-')
  })
})
