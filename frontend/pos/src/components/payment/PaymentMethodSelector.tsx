/**
 * Payment method selector component.
 */
import React from 'react'
import { Card } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface PaymentMethodSelectorProps {
  value: 'cash' | 'bank_transfer'
  onChange: (value: 'cash' | 'bank_transfer') => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation()

  return (
    <Card padding="md" className="space-y-2">
      <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary, #111827)' }}>
        {t('payment.paymentMethod') || 'Payment Method'}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="paymentMethod"
          value="cash"
          checked={value === 'cash'}
          onChange={() => onChange('cash')}
          className="w-5 h-5"
        />
        <span style={{ color: 'var(--color-text-primary, #111827)' }}>
          {t('payment.cash') || 'Cash'}
        </span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="paymentMethod"
          value="bank_transfer"
          checked={value === 'bank_transfer'}
          onChange={() => onChange('bank_transfer')}
          className="w-5 h-5"
        />
        <span style={{ color: 'var(--color-text-primary, #111827)' }}>
          {t('payment.bankTransfer') || 'Bank Transfer'}
        </span>
      </label>
    </Card>
  )
}

