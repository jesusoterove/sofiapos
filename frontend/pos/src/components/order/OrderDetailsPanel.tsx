/**
 * Order details panel component.
 */
import React from 'react'
import { CustomerSelector } from './CustomerSelector'
import { OrderItemsList } from './OrderItemsList'
import { OrderTotals } from './OrderTotals'
import { OrderActions } from './OrderActions'
import { useOrderManagement } from '@/hooks/useOrderManagement'

interface OrderDetailsPanelProps {
  storeId: number
  onPayment: () => void
}

export function OrderDetailsPanel({ storeId, onPayment }: OrderDetailsPanelProps) {
  const {
    order,
    totals,
    updateQuantity,
    removeItem,
    setCustomer,
    clearOrder,
    saveDraft,
  } = useOrderManagement(storeId)

  return (
    <div
      className="w-96 flex flex-col bg-gray-50 border-l"
      style={{
        borderColor: 'var(--color-border-default, #E5E7EB)',
        height: '100%',
      }}
    >
      {/* Customer Selector */}
      <div className="p-4 border-b bg-white" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
        <CustomerSelector
          customerId={order?.customerId}
          onSelectCustomer={setCustomer}
        />
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto p-1">
        <OrderItemsList
          items={order?.items || [{ id: '1', productId: 1, productName: 'Product 1', quantity: 1, unitPrice: 10, total: 10 }, { id: '2', productId: 2, productName: 'Product 2', quantity: 10, unitPrice: 10, total: 10 }]}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
        />
      </div>

      {/* Order Totals */}
      <div className="p-4 border-t bg-white" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
        <OrderTotals totals={totals} />
      </div>

      {/* Order Actions */}
      <div className="p-4 border-t bg-white" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
        <OrderActions
          hasItems={(order?.items.length || 0) > 0}
          onSaveDraft={saveDraft}
          onPay={onPayment}
          onCancel={clearOrder}
        />
      </div>
    </div>
  )
}

