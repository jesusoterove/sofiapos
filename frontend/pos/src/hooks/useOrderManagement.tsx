/**
 * Hook for managing order state and operations.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { openDatabase, saveOrder, saveOrderItem, addToSyncQueue } from '../db'
import { getAllOrders, getOrderItems } from '../db/queries/orders'

export type OrderLocation = 'cash_register' | { type: 'table'; tableId: number }

export interface OrderItem {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  taxAmount: number
}

export interface Order {
  id: string
  orderNumber: string
  storeId: number
  customerId?: number
  tableId?: number | null
  items: OrderItem[]
  status: 'draft' | 'paid' | 'cancelled'
  subtotal: number
  taxes: number
  discount: number
  total: number
}

export function useOrderManagement(storeId: number, location?: OrderLocation) {
  const [order, setOrder] = useState<Order | null>(null)
  const orderRef = useRef<Order | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    orderRef.current = order
  }, [order])

  const calculateTotals = useCallback((items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxes = items.reduce((sum, item) => sum + item.taxAmount, 0)
    const discount = 0 // TODO: Implement discount logic
    const total = subtotal + taxes - discount

    return { subtotal, taxes, discount, total }
  }, [])
  
  // Load order for current location on mount or location change
  useEffect(() => {
    const loadOrderForLocation = async (loc: OrderLocation) => {
      const db = await openDatabase()
      const draftOrders = await getAllOrders(db, 'draft')
      
      if (loc === 'cash_register') {
        // Find cash register order (table_id is null)
        const cashOrder = draftOrders.find((o) => !o.table_id)
        if (cashOrder) {
          const items = await getOrderItems(db, cashOrder.id)
          const orderItems: OrderItem[] = items.map((item) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            taxRate: item.tax_rate,
            total: item.total,
            taxAmount: item.tax_amount,
          }))
          const totals = calculateTotals(orderItems)
          setOrder({
            id: cashOrder.id,
            orderNumber: cashOrder.order_number,
            storeId: cashOrder.store_id,
            customerId: cashOrder.customer_id,
            tableId: null,
            items: orderItems,
            status: 'draft',
            ...totals,
          })
        } else {
          setOrder(null)
        }
      } else if (typeof loc === 'object' && loc.type === 'table') {
        // Find table order
        const tableOrder = draftOrders.find((o) => o.table_id === loc.tableId)
        if (tableOrder) {
          const items = await getOrderItems(db, tableOrder.id)
          const orderItems: OrderItem[] = items.map((item) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            taxRate: item.tax_rate,
            total: item.total,
            taxAmount: item.tax_amount,
          }))
          const totals = calculateTotals(orderItems)
          setOrder({
            id: tableOrder.id,
            orderNumber: tableOrder.order_number,
            storeId: tableOrder.store_id,
            customerId: tableOrder.customer_id,
            tableId: tableOrder.table_id ?? null,
            items: orderItems,
            status: 'draft',
            ...totals,
          })
        } else {
          setOrder(null)
        }
      }
    }
    
    const currentLoc = location || 'cash_register'
    loadOrderForLocation(currentLoc)
  }, [location, calculateTotals])

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

  const addItem = useCallback(
    (product: { id: number; name: string; selling_price: number; tax_rate: number }) => {
      setOrder((currentOrder) => {
        // If no order exists, create one with default location based on current location
        const orderId = currentOrder?.id || `order-${Date.now()}`
        const orderNumber = currentOrder?.orderNumber || `ORD-${Date.now()}`
        const existingItem = currentOrder?.items.find((item) => item.productId === product.id)
        
        // Determine tableId based on location
        let tableId: number | null | undefined = currentOrder?.tableId
        if (!currentOrder && location) {
          if (location === 'cash_register') {
            tableId = null
          } else if (typeof location === 'object' && location.type === 'table') {
            tableId = location.tableId
          }
        }

        let newItems: OrderItem[]
        if (existingItem && currentOrder) {
          newItems = currentOrder.items.map((item) => {
            if (item.productId === product.id) {
              const newQuantity = item.quantity + 1
              const newTotal = newQuantity * item.unitPrice
              const newTaxAmount = newTotal * item.taxRate
              return {
                ...item,
                quantity: newQuantity,
                total: newTotal,
                taxAmount: newTaxAmount,
              }
            }
            return item
          })
        } else {
          const itemTotal = product.selling_price
          const taxAmount = itemTotal * (product.tax_rate || 0)
          const newItem: OrderItem = {
            id: `item-${Date.now()}-${product.id}`,
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.selling_price,
            taxRate: product.tax_rate || 0,
            total: itemTotal,
            taxAmount: taxAmount,
          }
          newItems = [...(currentOrder?.items || []), newItem]
        }

        const totals = calculateTotals(newItems)

        return {
          id: orderId,
          orderNumber,
          storeId,
          customerId: currentOrder?.customerId,
          tableId: tableId ?? null,
          items: newItems,
          status: 'draft' as const,
          ...totals,
        }
      })
    },
    [storeId, calculateTotals, location]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId)
        return
      }

      setOrder((currentOrder) => {
        if (!currentOrder) return currentOrder

        const newItems = currentOrder.items.map((item) => {
          if (item.id === itemId) {
            const newTotal = quantity * item.unitPrice
            const newTaxAmount = newTotal * item.taxRate
            return {
              ...item,
              quantity,
              total: newTotal,
              taxAmount: newTaxAmount,
            }
          }
          return item
        })

        const totals = calculateTotals(newItems)

        return {
          ...currentOrder,
          items: newItems,
          ...totals,
        }
      })
    },
    [calculateTotals, removeItem]
  )

  const setCustomer = useCallback((customerId?: number) => {
    setOrder((currentOrder) => {
      if (!currentOrder) return currentOrder
      return {
        ...currentOrder,
        customerId,
      }
    })
  }, [])

  const setTable = useCallback((tableId?: number | null) => {
    console.log('[useOrderManagement] setTable called with tableId:', tableId)
    setOrder((currentOrder) => {
      console.log('[useOrderManagement] setTable - currentOrder:', currentOrder)
      if (!currentOrder) {
        console.log('[useOrderManagement] setTable - no currentOrder, returning null')
        return currentOrder
      }
      const updatedOrder = {
        ...currentOrder,
        tableId: tableId !== undefined ? tableId : null,
      }
      console.log('[useOrderManagement] setTable - updatedOrder:', updatedOrder)
      return updatedOrder
    })
  }, [])

  const clearOrder = useCallback(() => {
    setOrder(null)
  }, [])

  const saveDraft = useCallback(async () => {
    // Use ref to get the latest order state (avoids stale closure issues)
    const orderToSave = orderRef.current
    
    if (!orderToSave) {
      console.log('[useOrderManagement] saveDraft - no order to save')
      return
    }

    const db = await openDatabase()
    
    // Recalculate totals before saving
    const totals = calculateTotals(orderToSave.items)
    
    // ALWAYS save locally first (for performance, even when online)
    console.log('[useOrderManagement] saveDraft - saving order with tableId:', orderToSave.tableId)
    const orderData = {
      id: orderToSave.id,
      order_number: orderToSave.orderNumber,
      store_id: orderToSave.storeId,
      customer_id: orderToSave.customerId,
      table_id: orderToSave.tableId ?? null,
      status: orderToSave.status,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
      sync_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('[useOrderManagement] saveDraft - orderData.table_id:', orderData.table_id)

    await saveOrder(db, orderData)

    // Save order items
    for (const item of orderToSave.items) {
      await saveOrderItem(db, {
        id: item.id,
        order_id: orderToSave.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        total: item.total,
        tax_amount: item.taxAmount,
        sync_status: 'pending' as const,
      })
    }

    // Add to sync queue (only paid orders will be pushed)
    if (orderToSave.status === 'paid') {
      await addToSyncQueue(db, {
        type: 'order',
        action: 'create',
        data_id: orderToSave.id,
        data: orderData,
      })
    }
    
    // Update local order with recalculated totals (preserve tableId)
    setOrder((current) => {
      if (!current) return null
      return { ...current, ...totals }
    })
  }, [calculateTotals])

  const markAsPaid = useCallback(async (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => {
    if (!order) return

    const db = await openDatabase()
    
    // Recalculate totals
    const totals = calculateTotals(order.items)
    
    // ALWAYS save locally first with paid status (for performance)
    const orderData = {
      id: order.id,
      order_number: order.orderNumber,
      store_id: order.storeId,
      customer_id: order.customerId,
      table_id: order.tableId ?? null,
      status: 'paid' as const,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
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
        tax_rate: item.taxRate,
        total: item.total,
        tax_amount: item.taxAmount,
        sync_status: 'pending' as const,
      })
    }

    // Add to sync queue (only paid orders are pushed)
    await addToSyncQueue(db, {
      type: 'order',
      action: 'create',
      data_id: order.id,
      data: {
        ...orderData,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
      },
    })
  }, [order, calculateTotals])

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
    setTable,
    clearOrder,
    saveDraft,
    markAsPaid,
  }
}

