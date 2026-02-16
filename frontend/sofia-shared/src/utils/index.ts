export const formatCurrency = (value: number, currency: string = 'USD', locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatNumber = (value: number, locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale).format(value)
}
