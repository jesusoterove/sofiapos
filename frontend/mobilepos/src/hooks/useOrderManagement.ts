import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  openDatabase, saveOrder, saveOrderItem, getDraftOrders,
  getOrderItemsByOrderNumber, addToSyncQueue,
} from '@/db'
import { useCartStore, type CartItem } from '@/stores/cartStore'
import { useAuth } from '@/contexts/AuthContext'
import { getRegistration } from '@/utils/registration'

export interface OpenOrder {
  orderNumber: string
  tableId?: number | null
  total: number
  itemCount: number
  createdAt: string
}

export function useOrderManagement(storeId: number) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const cart = useCartStore()

  const { data: openOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['openOrders', storeId],
    queryFn: async () => {
      const db = await openDatabase()
      const orders = await getDraftOrders(db)
      const result: OpenOrder[] = []
      for (const o of orders) {
        const items = await getOrderItemsByOrderNumber(db, o.order_number)
        result.push({
          orderNumber: o.order_number,
          tableId: o.table_id,
          total: o.total,
          itemCount: items.length,
          createdAt: o.created_at,
        })
      }
      return result
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
  })

  const generateOrderNumber = useCallback(async (): Promise<string> => {
    const reg = await getRegistration()
    const code = reg?.cashRegisterCode || 'M01'
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

    const db = await openDatabase()
    const row = await db.getFirstAsync<{ sequence_number: number }>(
      `SELECT sequence_number FROM sequences WHERE cash_register_id = ? AND doc_type = 'order' AND date = ?`,
      [reg?.cashRegisterId ?? 0, dateStr]
    )
    const seq = (row?.sequence_number ?? 0) + 1
    await db.runAsync(
      `INSERT OR REPLACE INTO sequences (id, cash_register_id, doc_type, date, sequence_number, updated_at) VALUES (?, ?, 'order', ?, ?, ?)`,
      [`${reg?.cashRegisterId ?? 0}-order-${dateStr}`, reg?.cashRegisterId ?? 0, dateStr, seq, new Date().toISOString()]
    )
    return `${code}-${dateStr}-${String(seq).padStart(4, '0')}`
  }, [])

  const saveDraft = useCallback(async () => {
    const items = cart.items
    if (items.length === 0) return

    let orderNumber = cart.orderNumber
    if (!orderNumber || orderNumber.startsWith('ORD-TEMP-')) {
      orderNumber = await generateOrderNumber()
      cart.setOrderNumber(orderNumber)
    }

    const totals = cart.getTotals()
    const db = await openDatabase()

    await saveOrder(db, {
      order_number: orderNumber,
      id: 0,
      store_id: storeId,
      shift_id: null,
      cash_register_id: null,
      customer_id: cart.customerId ?? null,
      table_id: cart.tableId ?? null,
      status: 'draft',
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
      payment_method: null,
      amount_paid: null,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await db.runAsync('DELETE FROM order_items WHERE order_number = ?', [orderNumber])
    for (const item of items) {
      await saveOrderItem(db, {
        order_number: orderNumber,
        order_id: null,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_of_measure_id: item.unitOfMeasureId ?? null,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        total: item.total,
        sync_status: 'pending',
      })
    }

    refetchOrders()
  }, [cart, storeId, generateOrderNumber, refetchOrders])

  const markAsPaid = useCallback(async (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => {
    const items = cart.items
    if (items.length === 0) return

    let orderNumber = cart.orderNumber
    if (!orderNumber || orderNumber.startsWith('ORD-TEMP-')) {
      orderNumber = await generateOrderNumber()
      cart.setOrderNumber(orderNumber)
    }

    const totals = cart.getTotals()
    const db = await openDatabase()
    const reg = await getRegistration()

    const orderData = {
      order_number: orderNumber,
      id: 0,
      store_id: storeId,
      shift_id: null,
      cash_register_id: reg?.cashRegisterId ?? null,
      customer_id: cart.customerId ?? null,
      table_id: cart.tableId ?? null,
      status: 'paid' as const,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      sync_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveOrder(db, orderData)

    await db.runAsync('DELETE FROM order_items WHERE order_number = ?', [orderNumber])
    for (const item of items) {
      await saveOrderItem(db, {
        order_number: orderNumber,
        order_id: null,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_of_measure_id: item.unitOfMeasureId ?? null,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        total: item.total,
        sync_status: 'pending',
      })
    }

    await addToSyncQueue(db, {
      type: 'order',
      action: 'create',
      data_id: orderNumber,
      data: JSON.stringify({ ...orderData, payment_method: paymentMethod, amount_paid: amountPaid }),
      retry_count: 0,
      created_at: new Date().toISOString(),
    })

    cart.clear()
    refetchOrders()
  }, [cart, storeId, generateOrderNumber, refetchOrders])

  const clearOrder = useCallback(async () => {
    const orderNumber = cart.orderNumber
    cart.clear()
    if (orderNumber && !orderNumber.startsWith('ORD-TEMP-')) {
      const db = await openDatabase()
      await db.runAsync('DELETE FROM order_items WHERE order_number = ?', [orderNumber])
      await db.runAsync("DELETE FROM orders WHERE order_number = ? AND status = 'draft'", [orderNumber])
      refetchOrders()
    }
  }, [cart, refetchOrders])

  const loadOrder = useCallback(async (orderNumber: string) => {
    const db = await openDatabase()
    const dbItems = await getOrderItemsByOrderNumber(db, orderNumber)
    const order = await db.getFirstAsync<{ customer_id: number | null; table_id: number | null }>(
      'SELECT customer_id, table_id FROM orders WHERE order_number = ?',
      [orderNumber]
    )
    const cartItems: CartItem[] = dbItems.map((i) => ({
      id: `item-${i.id}-${i.product_id}`,
      productId: i.product_id,
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      taxRate: i.tax_rate,
      taxAmount: i.tax_amount,
      total: i.total,
      unitOfMeasureId: i.unit_of_measure_id ?? undefined,
    }))
    cart.loadOrder(cartItems, orderNumber, order?.customer_id ?? undefined, order?.table_id)
  }, [cart])

  return {
    openOrders,
    refetchOrders,
    saveDraft,
    markAsPaid,
    clearOrder,
    loadOrder,
    generateOrderNumber,
  }
}
