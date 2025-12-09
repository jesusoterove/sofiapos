/**
 * Payment method selector component with toggle buttons.
 */
import React from 'react'
import { useTranslation } from '@/i18n/hooks'

interface PaymentMethodSelectorProps {
  value: 'cash' | 'bank_transfer'
  onChange: (value: 'cash' | 'bank_transfer') => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('cash')}
        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
          value === 'cash'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
        style={
          value === 'cash'
            ? {
                borderColor: 'var(--color-primary-500, #3B82F6)',
                backgroundColor: 'var(--color-primary-50, #EFF6FF)',
                color: 'var(--color-primary-700, #1D4ED8)',
              }
            : {
                borderColor: 'var(--color-border-default, #D1D5DB)',
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
              }
        }
      >
        {t('payment.cash') || 'Cash'}
      </button>
      <button
        type="button"
        onClick={() => onChange('bank_transfer')}
        className={`flex-1 h-12 rounded-lg border-2 font-medium transition-all ${
          value === 'bank_transfer'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
        style={
          value === 'bank_transfer'
            ? {
                borderColor: 'var(--color-primary-500, #3B82F6)',
                backgroundColor: 'var(--color-primary-50, #EFF6FF)',
                color: 'var(--color-primary-700, #1D4ED8)',
              }
            : {
                borderColor: 'var(--color-border-default, #D1D5DB)',
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
              }
        }
      >
        {t('payment.bankTransfer') || 'Bank Transfer'}
      </button>
    </div>
  )
}

