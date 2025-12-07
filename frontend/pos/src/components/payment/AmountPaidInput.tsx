/**
 * Amount paid input component with numeric keypad.
 */
import React, { useState } from 'react'
import { Card, Modal, NumericKeypad } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface AmountPaidInputProps {
  value: string
  onChange: (value: string) => void
  orderTotal: number
}

export function AmountPaidInput({ value, onChange, orderTotal }: AmountPaidInputProps) {
  const { t } = useTranslation()
  const [showKeypad, setShowKeypad] = useState(false)

  const handleKeypadChange = (newValue: string) => {
    onChange(newValue)
  }

  return (
    <>
      <Card padding="md">
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {t('payment.amountPaid') || 'Amount Paid'}
        </div>
        <div
          onClick={() => setShowKeypad(true)}
          className="h-14 text-2xl font-bold text-right px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          ${value || '0.00'}
        </div>
      </Card>

      <Modal
        isOpen={showKeypad}
        onClose={() => setShowKeypad(false)}
        title={t('payment.amountPaid') || 'Amount Paid'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
              ${value || '0.00'}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {t('payment.orderTotal') || 'Order Total'}: ${orderTotal.toFixed(2)}
            </div>
          </div>
          <NumericKeypad
            value={value}
            onChange={handleKeypadChange}
            maxDecimals={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onChange(orderTotal.toString())}
              className="flex-1 h-12 rounded-lg border font-medium"
              style={{
                borderColor: 'var(--color-border-default, #E5E7EB)',
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
              }}
            >
              Exact Amount
            </button>
            <button
              onClick={() => setShowKeypad(false)}
              className="flex-1 h-12 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary-500, #3B82F6)' }}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

