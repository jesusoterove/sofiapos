/**
 * Order details panel component.
 */
import { useState, useEffect } from 'react'
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
  onClearOrder: () => Promise<void>
  onSaveDraft: () => Promise<void>
  onPayment: () => void
  onOrderSaved?: () => void
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
  onOrderSaved,
  storeId,
}: OrderDetailsPanelProps) {
  const [showTableSelection, setShowTableSelection] = useState(false)

  // Track order changes to ensure component updates
  useEffect(() => {
    console.log('[OrderDetailsPanel] order prop changed, component should re-render')
  }, [order?.id, order?.items?.length, order?.total, order])

  const handleSaveDraft = async () => {
    // If order already has a table assigned, save directly
    if (order?.tableId !== undefined && order?.tableId !== null) {
      await onSaveDraft()
      // Notify parent that order was saved
      if (onOrderSaved) {
        onOrderSaved()
      }
      return
    }

    // Otherwise, show table selection dialog
    setShowTableSelection(true)
  }

  useEffect(() => {
    console.log('[OrderDetailsPanel] order prop changed:', {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      tableId: order?.tableId,
      itemCount: order?.items?.length || 0,
      total: order?.total,
      itemsReference: order?.items,
      orderReference: order,
    })
  }, [order])

  useEffect(() => {
    console.log('[OrderDetailsPanel] totals prop changed:', totals)
  }, [totals])

  const handleTableSelected = async (table: { id: number } | null) => {
    setShowTableSelection(false)
    // Assign table to order
    console.log('[OrderDetailsPanel] handleTableSelected - setting table:', table?.id)
    onSetTable(table?.id ?? null)
    // Wait for React state update to complete
    // Use requestAnimationFrame to ensure state update is processed
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50)
      })
    })
    console.log('[OrderDetailsPanel] handleTableSelected - calling onSaveDraft')
    await onSaveDraft()
    // Notify parent that order was saved
    if (onOrderSaved) {
      onOrderSaved()
    }
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

