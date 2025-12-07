/**
 * Hook for managing order state and operations.
 */
import { useState, useCallback, useMemo } from 'react'
import { openDatabase, saveOrder, saveOrderItem, addToSyncQueue } from '../db'

export interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  id: string
  orderNumber: string
  storeId: number
  customerId?: number
  items: OrderItem[]
  status: 'draft' | 'paid' | 'cancelled'
  subtotal: number
  taxes: number
  discount: number
  total: number
}

const TAX_RATE = 0.16 // 16% tax rate - should come from settings

export function useOrderManagement(storeId: number) {
  const [order, setOrder] = useState<Order | null>(null)

  const calculateTotals = useCallback((items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxes = subtotal * TAX_RATE
    const discount = 0 // TODO: Implement discount logic
    const total = subtotal + taxes - discount

    return { subtotal, taxes, discount, total }
  }, [])

  const addItem = useCallback(
    (product: { id: number; name: string; selling_price: number }) => {
      setOrder((currentOrder) => {
        const orderId = currentOrder?.id || `order-${Date.now()}`
        const orderNumber = currentOrder?.orderNumber || `ORD-${Date.now()}`
        const existingItem = currentOrder?.items.find((item) => item.productId === product.id)

        let newItems: OrderItem[]
        if (existingItem) {
          newItems = currentOrder.items.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total: (item.quantity + 1) * item.unitPrice,
                }
              : item
          )
        } else {
          const newItem: OrderItem = {
            id: `item-${Date.now()}-${product.id}`,
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.selling_price,
            total: product.selling_price,
          }
          newItems = [...(currentOrder?.items || []), newItem]
        }

        const totals = calculateTotals(newItems)

        return {
          id: orderId,
          orderNumber,
          storeId,
          customerId: currentOrder?.customerId,
          items: newItems,
          status: 'draft' as const,
          ...totals,
        }
      })
    },
    [storeId, calculateTotals]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId)
        return
      }

      setOrder((currentOrder) => {
        if (!currentOrder) return currentOrder

        const newItems = currentOrder.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                total: quantity * item.unitPrice,
              }
            : item
        )

        const totals = calculateTotals(newItems)

        return {
          ...currentOrder,
          items: newItems,
          ...totals,
        }
      })
    },
    [calculateTotals]
  )

  const removeItem = useCallback((itemId: string) => {
    setOrder((currentOrder) => {
      if (!currentOrder) return currentOrder

      const newItems = currentOrder.items.filter((item) => item.id !== itemId)
      const totals = calculateTotals(newItems)

      return {
        ...currentOrder,
        items: newItems,
        ...totals,
      }
    })
  }, [calculateTotals])

  const setCustomer = useCallback((customerId?: number) => {
    setOrder((currentOrder) => {
      if (!currentOrder) return currentOrder
      return {
        ...currentOrder,
        customerId,
      }
    })
  }, [])

  const clearOrder = useCallback(() => {
    setOrder(null)
  }, [])

  const saveDraft = useCallback(async () => {
    if (!order) return

    const db = await openDatabase()
    const orderData = {
      id: order.id,
      order_number: order.orderNumber,
      store_id: order.storeId,
      customer_id: order.customerId,
      status: order.status,
      subtotal: order.subtotal,
      taxes: order.taxes,
      discount: order.discount,
      total: order.total,
      sync_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveOrder(db, orderData)

    // Save order items
    for (const item of order.items) {
      await saveOrderItem(db, {
        id: item.id,
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        sync_status: 'pending' as const,
      })
    }

    // Add to sync queue
    await addToSyncQueue(db, {
      type: 'order',
      action: 'create',
      data_id: order.id,
      data: orderData,
    })
  }, [order])

  const totals = useMemo(() => {
    if (!order) {
      return { subtotal: 0, taxes: 0, discount: 0, total: 0 }
    }
    return {
      subtotal: order.subtotal,
      taxes: order.taxes,
      discount: order.discount,
      total: order.total,
    }
  }, [order])

  return {
    order,
    totals,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    clearOrder,
    saveDraft,
  }
}

