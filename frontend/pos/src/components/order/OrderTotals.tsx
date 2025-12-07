/**
 * Order totals component.
 */
import React from 'react'
import { useTranslation } from '@/i18n/hooks'

interface OrderTotalsProps {
  totals: {
    subtotal: number
    taxes: number
    discount: number
    total: number
  }
}

export function OrderTotals({ totals }: OrderTotalsProps) {
  const { t } = useTranslation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
          {t('common.subtotal') || 'Subtotal'}:
        </span>
        <span style={{ color: 'var(--color-text-primary, #111827)' }}>
          {formatPrice(totals.subtotal)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
          {t('common.taxes') || 'Taxes'}:
        </span>
        <span style={{ color: 'var(--color-text-primary, #111827)' }}>
          {formatPrice(totals.taxes)}
        </span>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.discount') || 'Discount'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            -{formatPrice(totals.discount)}
          </span>
        </div>
      )}
      <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
        <div className="flex justify-between">
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {t('common.total') || 'Total'}:
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--color-primary-500, #3B82F6)' }}>
            {formatPrice(totals.total)}
          </span>
        </div>
      </div>
    </div>
  )
}

