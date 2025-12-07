/**
 * Payment summary component.
 */
import React from 'react'
import { Card } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface PaymentSummaryProps {
  subtotal: number
  taxes: number
  total: number
  amountPaid: number
  change: number
}

export function PaymentSummary({
  subtotal,
  taxes,
  total,
  amountPaid,
  change,
}: PaymentSummaryProps) {
  const { t } = useTranslation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <Card padding="md">
      <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary, #111827)' }}>
        Payment Summary
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.subtotal') || 'Subtotal'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.taxes') || 'Taxes'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            {formatPrice(taxes)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.total') || 'Total'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            {formatPrice(total)}
          </span>
        </div>
        {amountPaid > 0 && (
          <>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {t('payment.amountPaid') || 'Paid'}:
              </span>
              <span style={{ color: 'var(--color-text-primary, #111827)' }}>
                {formatPrice(amountPaid)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {t('payment.change') || 'Change'}:
              </span>
              <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPrice(Math.abs(change))}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

