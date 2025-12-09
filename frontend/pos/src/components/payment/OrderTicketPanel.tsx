/**
 * Order ticket panel component - readonly order display for payment screen.
 */
import React from 'react'
import { useTranslation } from '@/i18n/hooks'
import type { Order } from '@/hooks/useOrderManagement'

interface OrderTicketPanelProps {
  order: Order | null
  totals: {
    subtotal: number
    taxes: number
    discount: number
    total: number
  }
}

export function OrderTicketPanel({ order, totals }: OrderTicketPanelProps) {
  const { t } = useTranslation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const orderNumber = order?.orderNumber || '1'

  return (
    <div
      className="flex flex-col h-full bg-gray-50"
      style={{
        backgroundColor: 'var(--color-bg-default, #F9FAFB)',
      }}
    >
      {/* Ticket Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: 'var(--color-border-default, #E5E7EB)',
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
        }}
      >
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {t('payment.ticket') || 'Ticket'} [{orderNumber}]
        </h2>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
              <th
                className="text-left py-2 px-2 text-sm font-medium"
                style={{ color: 'var(--color-text-secondary, #6B7280)' }}
              >
                {t('common.unit') || 'Unit'}
              </th>
              <th
                className="text-left py-2 px-2 text-sm font-medium"
                style={{ color: 'var(--color-text-secondary, #6B7280)' }}
              >
                {t('order.item') || 'Item'}
              </th>
              <th
                className="text-right py-2 px-2 text-sm font-medium"
                style={{ color: 'var(--color-text-secondary, #6B7280)' }}
              >
                {t('common.price') || 'Price'}
              </th>
            </tr>
          </thead>
          <tbody>
            {order?.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                  style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}
                >
                  <td className="py-2 px-2 text-sm" style={{ color: 'var(--color-text-primary, #111827)' }}>
                    {item.quantity}
                  </td>
                  <td className="py-2 px-2 text-sm" style={{ color: 'var(--color-text-primary, #111827)' }}>
                    {item.productName}
                  </td>
                  <td className="py-2 px-2 text-sm text-right" style={{ color: 'var(--color-text-primary, #111827)' }}>
                    {formatPrice(item.total)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-center text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                  {t('order.noItems') || 'No items in order'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Summary */}
      <div
        className="px-6 py-4 border-t space-y-2"
        style={{
          borderColor: 'var(--color-border-default, #E5E7EB)',
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
        }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.subtotal') || 'Subtotal'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            {formatPrice(totals.subtotal)}
          </span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {t('common.discount') || 'Discount'}:
            </span>
            <span style={{ color: 'var(--color-text-primary, #111827)' }}>
              {formatPrice(totals.discount)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('common.tax') || 'Tax'}:
          </span>
          <span style={{ color: 'var(--color-text-primary, #111827)' }}>
            {formatPrice(totals.taxes)}
          </span>
        </div>
        <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
          <div className="flex justify-between">
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('common.total') || 'TOTAL'}:
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--color-primary-500, #3B82F6)' }}>
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

