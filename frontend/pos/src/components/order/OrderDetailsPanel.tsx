/**
 * Order details panel component.
 */
import { useState } from 'react'
import { CustomerSelector } from './CustomerSelector'
import { OrderItemsList } from './OrderItemsList'
import { OrderTotals } from './OrderTotals'
import { OrderActions } from './OrderActions'
import { TableSelectionDialog } from './TableSelectionDialog'
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
  onSetTable: (tableId?: number | null) => void
  onClearOrder: () => void
  onSaveDraft: () => Promise<void>
  onPayment: () => void
  storeId: number
}

export function OrderDetailsPanel({
  order,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onSetCustomer,
  onSetTable,
  onClearOrder,
  onSaveDraft,
  onPayment,
  storeId,
}: OrderDetailsPanelProps) {
  const [showTableSelection, setShowTableSelection] = useState(false)

  const handleSaveDraft = async () => {
    // If order already has a table assigned, save directly
    if (order?.tableId !== undefined && order?.tableId !== null) {
      await onSaveDraft()
      return
    }

    // Otherwise, show table selection dialog
    setShowTableSelection(true)
  }

  const handleTableSelected = async (table: { id: number } | null) => {
    setShowTableSelection(false)
    // Assign table to order
    onSetTable(table?.id ?? null)
    // Wait a bit for state to update, then save
    // Use a promise-based approach instead of setTimeout
    await new Promise((resolve) => setTimeout(resolve, 100))
    await onSaveDraft()
  }

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
          onSaveDraft={handleSaveDraft}
          onPay={onPayment}
          onCancel={onClearOrder}
        />
      </div>

      {/* Table Selection Dialog */}
      <TableSelectionDialog
        isOpen={showTableSelection}
        onClose={() => setShowTableSelection(false)}
        onSelectTable={handleTableSelected}
        storeId={storeId}
      />
    </div>
  )
}

