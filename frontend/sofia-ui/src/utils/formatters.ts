/**
 * Utility functions for formatting values.
 */

/**
 * Format a number as currency using Intl.NumberFormat.
 * @param price - The price/amount to format
 * @param locale - The locale to use (default: 'en-US')
 * @param currency - The currency code (default: 'USD')
 * @param minimumFractionDigits - Minimum fraction digits (default: 0)
 * @returns Formatted currency string
 */
export function formatPrice(
  price: number,
  locale: string = 'en-US',
  currency: string = 'USD',
  minimumFractionDigits: number = 0
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
  }).format(price)
}

