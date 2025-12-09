/**
 * Numeric keypad component with integrated quick amount buttons.
 */
import { FaBackspace } from 'react-icons/fa'
import { useTranslation } from '@/i18n/hooks'
import { formatPrice } from '@sofiapos/ui'
import {
  QUICK_AMOUNT_06,
  QUICK_AMOUNT_07,
  QUICK_AMOUNTS_FIRST_FIVE,
} from './constants'

interface NumericKeypadProps {
  onNumberClick: (num: string) => void
  onDecimalClick: () => void
  onBackspace: () => void
  onClear: () => void
  onQuickAmount: (amount: number) => void
}

export function NumericKeypad({
  onNumberClick,
  onDecimalClick,
  onBackspace,
  onClear,
  onQuickAmount,
}: NumericKeypadProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-5 gap-2">
      {/* Column 1: First 5 Quick Amount Buttons */}
      <div className="flex flex-col gap-2">
        {QUICK_AMOUNTS_FIRST_FIVE.map((amount) => (
          <button
            key={amount}
            onClick={() => onQuickAmount(amount)}
            className="h-14 text-base font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            style={{
              borderColor: 'var(--color-border-default, #E5E7EB)',
              backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
              color: 'var(--color-primary-500, #3B82F6)',
            }}
          >
            {formatPrice(amount)}
          </button>
        ))}
      </div>

      {/* Column 2: 1, 4, 7, ., QUICK_AMOUNT_06 (50) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onNumberClick('1')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          1
        </button>
        <button
          onClick={() => onNumberClick('4')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          4
        </button>
        <button
          onClick={() => onNumberClick('7')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          7
        </button>
        <button
          onClick={onDecimalClick}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          .
        </button>
        <button
          onClick={() => onQuickAmount(QUICK_AMOUNT_06)}
          className="h-14 text-base font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-primary-500, #3B82F6)',
          }}
          >
          {formatPrice(QUICK_AMOUNT_06)}
        </button>
      </div>

      {/* Column 3: 2, 5, 8, 0, QUICK_AMOUNT_07 (100) */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onNumberClick('2')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          2
        </button>
        <button
          onClick={() => onNumberClick('5')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          5
        </button>
        <button
          onClick={() => onNumberClick('8')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          8
        </button>
        <button
          onClick={() => onNumberClick('0')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          0
        </button>
        <button
          onClick={() => onQuickAmount(QUICK_AMOUNT_07)}
          className="h-14 text-base font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-primary-500, #3B82F6)',
          }}
          >
          {formatPrice(QUICK_AMOUNT_07)}
        </button>
      </div>

      {/* Column 4: 3, 6, 9, 00, Backspace */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onNumberClick('3')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          3
        </button>
        <button
          onClick={() => onNumberClick('6')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          6
        </button>
        <button
          onClick={() => onNumberClick('9')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          9
        </button>
        <button
          onClick={() => onNumberClick('00')}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          00
        </button>
        <button
          onClick={onBackspace}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation flex items-center justify-center"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          <FaBackspace />
        </button>
      </div>

      {/* Column 5: Clear */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onClear}
          className="h-full text-base font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          {t('common.clear') || 'CLEAR'}
        </button>
      </div>
    </div>
  )
}

