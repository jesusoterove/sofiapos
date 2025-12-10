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

  const getBorderColor = () => {
    if (disabled) {
      return 'var(--color-border-disabled, #D1D5DB)'
    }
    if (isNegative) {
      return 'var(--color-danger-600, #DC2626)' // Red border for negative
    }
    return 'var(--color-border-default, #E5E7EB)'
  }

  return (
    <div
      className="flex items-center gap-2 mt-0 border-b"
      style={{
        borderBottomColor: getBorderColor(),
      }}
    >
      <label 
        className="text-lg font-medium" 
        style={{ 
          color: disabled 
            ? 'var(--color-text-disabled, #9CA3AF)' 
            : 'var(--color-text-primary, #111827)' 
        }}
      >
        {t('payment.change') || 'Change: $'}
      </label>
      <div
        className={`flex-1 h-10 text-2xl font-bold text-right px-4 py-0 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: disabled 
            ? 'var(--color-bg-disabled, #F3F4F6)' 
            : 'var(--color-bg-paper, #FFFFFF)',
          color: getTextColor(),
        }}
      >
        {formatValue(absChange)}
      </div>
    </div>
  )
}

