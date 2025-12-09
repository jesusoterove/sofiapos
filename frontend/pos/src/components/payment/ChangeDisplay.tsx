/**
 * Change display component - styled like AmountPaidInput but with green text for positive values,
 * and red text with parentheses for negative values (missing amount).
 */
import { useTranslation } from '@/i18n/hooks'
import { formatPrice } from '@sofiapos/ui'

interface ChangeDisplayProps {
  change: number
  disabled?: boolean
}

export function ChangeDisplay({ change, disabled = false }: ChangeDisplayProps) {
  const { t } = useTranslation()

  const isNegative = change < 0
  const absChange = Math.abs(change)

  const formatValue = (val: number) => {
    const formatted = formatPrice(val, 'en-US', 'USD', 2)
    // Wrap in parentheses if negative
    return isNegative ? `(${formatted})` : formatted
  }

  // Determine color based on value and disabled state
  const getTextColor = () => {
    if (disabled) {
      return 'var(--color-text-disabled, #9CA3AF)'
    }
    if (isNegative) {
      return 'var(--color-danger-600, #DC2626)' // Red for missing amount
    }
    return 'var(--color-success-600, #16A34A)' // Green for change
  }

  return (
    <div className="flex items-center gap-2">
      <label 
        className="text-sm font-medium" 
        style={{ 
          color: disabled 
            ? 'var(--color-text-disabled, #9CA3AF)' 
            : 'var(--color-text-primary, #111827)' 
        }}
      >
        {t('payment.change') || 'Change: $'}
      </label>
      <div
        className={`flex-1 h-14 text-2xl font-bold text-right px-4 py-2 border rounded-lg ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          borderColor: disabled 
            ? 'var(--color-border-disabled, #D1D5DB)' 
            : isNegative
            ? 'var(--color-danger-200, #FECACA)' // Light red border for negative
            : 'var(--color-border-default, #E5E7EB)',
          backgroundColor: disabled 
            ? 'var(--color-bg-disabled, #F3F4F6)' 
            : isNegative
            ? 'var(--color-danger-50, #FEF2F2)' // Light red background for negative
            : 'var(--color-bg-paper, #FFFFFF)',
          color: getTextColor(),
        }}
      >
        {formatValue(absChange)}
      </div>
    </div>
  )
}

