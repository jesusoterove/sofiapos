/**
 * Order item component.
 */
import React from 'react'
import { Button } from '@sofiapos/ui'
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa'
import { Card } from '@sofiapos/ui'
import { OrderItemData } from './OrderItemsList'

interface OrderItemProps {
  item: OrderItemData
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
}

export function OrderItem({ item, onUpdateQuantity, onRemove }: OrderItemProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <Card padding="sm" className="relative">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {item.productName}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {formatPrice(item.unitPrice)} each
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 rounded hover:bg-gray-100"
          style={{ color: 'var(--color-danger-500, #EF4444)' }}
          aria-label="Remove item"
        >
          <FaTimes />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <FaMinus />
          </Button>
          <span className="w-10 text-center font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {item.quantity}
          </span>
          <Button
            variant="secondary"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <FaPlus />
          </Button>
        </div>
        <div className="font-bold" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {formatPrice(item.total)}
        </div>
      </div>
    </Card>
  )
}

