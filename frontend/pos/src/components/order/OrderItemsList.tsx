/**
 * Order items list component.
 */
import React from 'react'
import { OrderItem } from './OrderItem'
import { useTranslation } from '@/i18n/hooks'

export interface OrderItemData {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface OrderItemsListProps {
  items: OrderItemData[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
}

export function OrderItemsList({ items, onUpdateQuantity, onRemoveItem }: OrderItemsListProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        {t('order.noItems') || 'No items in order'}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {items.map((item) => (
        <OrderItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemoveItem}
        />
      ))}
    </div>
  )
}

