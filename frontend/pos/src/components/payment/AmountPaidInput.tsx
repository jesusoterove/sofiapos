/**
 * Amount paid input component - simple readonly input field.
 */
import { useTranslation } from '@/i18n/hooks'
import { formatPrice } from '@sofiapos/ui'

interface AmountPaidInputProps {
  value: string
  label?: string
}

export function AmountPaidInput({ value, label }: AmountPaidInputProps) {
  const { t } = useTranslation()

  const formatValue = (val: string) => {
    if (!val || val === '') return formatPrice(0, 'en-US', 'USD', 2)
    const num = parseFloat(val)
    if (isNaN(num)) return formatPrice(0, 'en-US', 'USD', 2)
    return formatPrice(num, 'en-US', 'USD', 2)
  }

  const displayLabel = label || t('payment.tenderedAmount') || 'Tendered amount: $'

  // If label is empty string, it means label is shown separately inline
  if (label === '') {
    return (
      <div
        className="flex-1 h-14 text-2xl font-bold text-right px-4 py-2 border rounded-lg"
        style={{
          borderColor: 'var(--color-border-default, #E5E7EB)',
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
          color: 'var(--color-text-primary, #111827)',
        }}
      >
        {formatValue(value)}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
        {displayLabel}
      </label>
      <div
        className="h-14 text-2xl font-bold text-right px-4 py-2 border rounded-lg"
        style={{
          borderColor: 'var(--color-border-default, #E5E7EB)',
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
          color: 'var(--color-text-primary, #111827)',
        }}
      >
        {formatValue(value)}
      </div>
    </div>
  )
}

