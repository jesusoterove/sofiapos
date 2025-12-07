/**
 * Order details panel component.
 */
import { CustomerSelector } from './CustomerSelector'
import { OrderItemsList } from './OrderItemsList'
import { OrderTotals } from './OrderTotals'
import { OrderActions } from './OrderActions'
import type { Order } from '@/hooks/useOrderManagement'

interface OrderDetailsPanelProps {
  order: Order | null
  totals: {
    subtotal: number
    taxes: number
    discount: number
    total: number
  }
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onSetCustomer: (customerId?: number) => void
  onClearOrder: () => void
  onSaveDraft: () => Promise<void>
  onPayment: () => void
}

export function OrderDetailsPanel({
  order,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onSetCustomer,
  onClearOrder,
  onSaveDraft,
  onPayment,
}: OrderDetailsPanelProps) {

  return (
    <div
      className="w-md flex flex-col bg-gray-50 border-l"
      style={{
        borderColor: 'var(--color-border-default, #E5E7EB)',
        height: '100%',
      }}
    >
      {/* Customer Selector */}
      <div className="p-4 border-b bg-white" style={{ borderColor: 'var(--color-border-default)' }}>
        <CustomerSelector
          customerId={order?.customerId}
          onSelectCustomer={onSetCustomer}
        />
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto p-1">
        <OrderItemsList
          items={order?.items || []}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />
      </div>

      {/* Order Totals */}
      <div className="p-2 border-t bg-white" style={{ borderColor: 'var(--color-border-default)' }}>
        <OrderTotals totals={totals} />
      </div>

      {/* Order Actions */}
      <div className="p-4 border-t bg-white" style={{ borderColor: 'var(--color-border-default)' }}>
        <OrderActions
          hasItems={(order?.items.length || 0) > 0}
          onSaveDraft={onSaveDraft}
          onPay={onPayment}
          onCancel={onClearOrder}
        />
      </div>
    </div>
  )
}

