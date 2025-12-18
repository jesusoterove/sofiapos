/**
 * Hook for managing order state and operations.
 * This is the single source of truth for order management, including:
 * - Current location state
 * - List of open orders
 * - Current order being edited
 * - Order operations (add, remove, update, save, etc.)
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openDatabase, saveOrder, saveOrderItem, addToSyncQueue } from '../db'
import { getAllOrders, getOrderItems, deleteOrder, getOrder } from '../db/queries/orders'
import { generateOrderNumber } from '../utils/documentNumbers'
import { getRegistration } from '../utils/registration'
import { useAuth } from '../contexts/AuthContext'
import { updateShiftSummaryOnPayment } from '../services/shiftSummary'

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

export interface OpenOrder {
  id: string
  orderNumber: string
  tableId?: number | null
  total: number
  itemCount: number
  location: OrderLocation
}

export function useOrderManagement(storeId: number) {
  const [order, setOrder] = useState<Order | null>(null)
  const [currentLocation, setCurrentLocation] = useState<OrderLocation>('cash_register')
  const orderRef = useRef<Order | null>(null)
  const loadCancelledRef = useRef(false)
  const [orderRefId, setOrderRefId] = useState<string | null>(null)
  const shouldAutoSaveRef = useRef(false) // Flag to track if we should auto-save
  const isInitialLoadRef = useRef(true) // Track if this is the initial load

  // Keep ref in sync with state
  useEffect(() => {
    orderRef.current = order
    console.log('[useOrderManagement] Order state changed:', {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      tableId: order?.tableId,
      itemCount: order?.items?.length || 0,
      orderReference: order,
    })
  }, [order])

  const calculateTotals = useCallback((items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxes = items.reduce((sum, item) => sum + item.taxAmount, 0)
    const discount = 0 // TODO: Implement discount logic
    const total = subtotal + taxes - discount

    return { subtotal, taxes, discount, total }
  }, [])

  // Fetch open (draft) orders list
  const { data: openOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['openOrders', storeId],
    queryFn: async () => {
      const db = await openDatabase()
      const orders = await getAllOrders(db, 'draft')
      
      // Transform to OpenOrder format
      const transformed: OpenOrder[] = []
      
      for (const order of orders) {
        try {
          const items = await getOrderItems(db, order.id)
          const location: OrderLocation = order.table_id
            ? { type: 'table', tableId: order.table_id }
            : 'cash_register'
          
          transformed.push({
            id: order.id,
            orderNumber: order.order_number,
            tableId: order.table_id ?? undefined,
            total: order.total,
            itemCount: items.length,
            location,
          })
        } catch (error) {
          console.error(`Error loading items for order ${order.id}:`, error)
        }
      }
      
      return transformed
    },
    staleTime: 5000, // Refetch every 5 seconds
    refetchInterval: 5000,
  })

  // Create a stable key for location comparison
  const locationKey = useMemo(() => {
    return currentLocation === 'cash_register' 
      ? 'cash_register' 
      : `table-${currentLocation.tableId}`
  }, [currentLocation])

  // Helper function to transform database items to OrderItem format
  const transformItems = useCallback((items: Awaited<ReturnType<typeof getOrderItems>>): OrderItem[] => {
    return items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate,
      total: item.total,
      taxAmount: item.tax_amount,
    }))
  }, [])

  // Helper function to create Order from database order and items
  const createOrderFromDb = useCallback((dbOrder: Awaited<ReturnType<typeof getAllOrders>>[0], orderItems: OrderItem[]): Order => {
    const totals = calculateTotals(orderItems)
    // Always create a new object with new array reference to ensure React detects changes
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      storeId: dbOrder.store_id,
      customerId: dbOrder.customer_id,
      tableId: dbOrder.table_id ?? null,
      items: [...orderItems], // Ensure items array is always a new reference
      status: 'draft' as const,
      ...totals,
    }
  }, [calculateTotals])

  // Load order for a specific location
  const loadOrderForLocation = useCallback(async (loc: OrderLocation) => {
    // Reset cancellation flag
    loadCancelledRef.current = false
    
    console.log('[useOrderManagement] loadOrderForLocation called with location:', loc)
    
    if (loadCancelledRef.current) {
      console.log('[useOrderManagement] Load cancelled for location:', loc)
      return
    }
    
    try {
      const db = await openDatabase()
      const draftOrders = await getAllOrders(db, 'draft')
      console.log('[useOrderManagement] Found draft orders:', draftOrders.length)
      
      if (loadCancelledRef.current) return
      
      // Find the order based on location type
      let foundOrder: Awaited<ReturnType<typeof getAllOrders>>[0] | undefined
      
      if (loc === 'cash_register') {
        // Find cash register order (table_id is null)
        foundOrder = draftOrders.find((o) => !o.table_id)
        console.log('[useOrderManagement] Cash register order found:', foundOrder?.id)
      } else if (typeof loc === 'object' && loc.type === 'table') {
        // Find table order
        console.log('[useOrderManagement] Looking for table order with tableId:', loc.tableId)
        console.log('[useOrderManagement] Available draft orders table_ids:', draftOrders.map(o => ({ id: o.id, table_id: o.table_id, table_id_type: typeof o.table_id })))
        foundOrder = draftOrders.find((o) => {
          const orderTableId = o.table_id
          const targetTableId = loc.tableId
          return orderTableId !== null && orderTableId !== undefined && 
                 targetTableId !== null && targetTableId !== undefined &&
                 Number(orderTableId) === Number(targetTableId)
        })
        console.log('[useOrderManagement] Table order found:', foundOrder?.id, 'for tableId:', loc.tableId)
      }
      
      if (loadCancelledRef.current) return
      
      if (foundOrder) {
        const items = await getOrderItems(db, foundOrder.id)
        if (loadCancelledRef.current) return
        
        console.log('[useOrderManagement] Order items:', items.length)
        const orderItems = transformItems(items)
        const newOrder = createOrderFromDb(foundOrder, orderItems)
        
        if (!loadCancelledRef.current) {
          // newOrder already has new array reference from createOrderFromDb
          // But create a completely new object reference to ensure React detects the change
          const orderToSet: Order = {
            ...newOrder,
            items: [...newOrder.items], // Ensure items array is a new reference
          }
          
          console.log('[useOrderManagement] Setting order (before setOrder):', {
            orderId: orderToSet.id,
            orderNumber: orderToSet.orderNumber,
            tableId: orderToSet.tableId,
            itemCount: orderToSet.items.length,
            orderReference: orderToSet,
            itemsReference: orderToSet.items,
            timestamp: Date.now(),
          })
          
          // Use direct value - React will detect the new object reference
          setOrder(orderToSet)
          
          console.log('[useOrderManagement] setOrder called, order should update')
        }
      } else {
        if (!loadCancelledRef.current) {
          const locationDesc = loc === 'cash_register' 
            ? 'cash register' 
            : `table ${typeof loc === 'object' ? loc.tableId : ''}`
          console.log('[useOrderManagement] No order found for', locationDesc, 'setting order to null')
          setOrder(null)
        }
      }
    } catch (error) {
      if (!loadCancelledRef.current) {
        console.error('[useOrderManagement] Error loading order for location:', error)
        setOrder(null)
      }
    }
  }, [transformItems, createOrderFromDb])

  // Load order when location changes (for initial load and location key changes)
  useEffect(() => {
    console.log('[useOrderManagement] useEffect triggered, loading order for location:', currentLocation, 'locationKey:', locationKey)
    // Disable auto-save during location changes/initial load
    shouldAutoSaveRef.current = false
    isInitialLoadRef.current = true
    loadOrderForLocation(currentLocation).then(() => {
      // After loading completes, enable auto-save for future changes
      isInitialLoadRef.current = false
      shouldAutoSaveRef.current = true
    })
    
    // Cleanup function to cancel if location changes before load completes
    return () => {
      loadCancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]) // Use locationKey for stable comparison


  // Location switching functions
  const switchToLocation = useCallback(async (location: OrderLocation) => {
    console.log('[useOrderManagement] switchToLocation called with:', location)
    setCurrentLocation(location)
    // Load order immediately after setting location
    await loadOrderForLocation(location)
    setOrderRefId(new Date().getTime().toString())
  }, [loadOrderForLocation])

  const switchToCashRegister = useCallback(() => {
    console.log('[useOrderManagement] switchToCashRegister called')
    const location: OrderLocation = 'cash_register'
    setCurrentLocation(location)
    // Load order immediately after setting location
    loadOrderForLocation(location)
  }, [loadOrderForLocation])

  const removeItem = useCallback((itemId: string) => {
    // Enable auto-save for this change
    shouldAutoSaveRef.current = true
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
      // Enable auto-save for this change
      shouldAutoSaveRef.current = true
      setOrder((currentOrder) => {
        // If no order exists, create one with default location based on current location
        const orderId = currentOrder?.id || 0 // Use 0 for unsynced orders
        const orderNumber = currentOrder?.orderNumber || `ORD-TEMP-${Date.now()}` // Temporary, will be generated on save
        const existingItem = currentOrder?.items.find((item) => item.productId === product.id)
        
        // Determine tableId based on current location
        let tableId: number | null | undefined = currentOrder?.tableId
        if (!currentOrder) {
          if (currentLocation === 'cash_register') {
            tableId = null
          } else if (typeof currentLocation === 'object' && currentLocation.type === 'table') {
            tableId = currentLocation.tableId
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

        // Create a completely new object with new array reference
        return {
          id: orderId,
          orderNumber,
          storeId,
          customerId: currentOrder?.customerId,
          tableId: tableId ?? null,
          items: [...newItems], // Ensure items array is a new reference
          status: 'draft' as const,
          ...totals,
        }
      })
    },
    [storeId, calculateTotals, currentLocation]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId)
        return
      }

      // Enable auto-save for this change
      shouldAutoSaveRef.current = true
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

        // Create a completely new object with new array reference
        return {
          ...currentOrder,
          items: [...newItems], // Ensure items array is a new reference
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

  const clearOrder = useCallback(async () => {
    // Get the current order before clearing
    const orderToDelete = orderRef.current
    
    // Clear the order state first
    setOrder(null)
    
    // Check database status before deleting (in-memory state might be stale after markAsPaid)
    if (orderToDelete?.id) {
      try {
        const db = await openDatabase()
        const dbOrder = await getOrder(db, orderToDelete.id)
        
        // Only delete if order exists in DB and is still a draft
        // If order was marked as paid, it should remain in the database
        if (dbOrder && dbOrder.status === 'draft') {
          console.log('[useOrderManagement] clearOrder - deleting draft order from database:', orderToDelete.id)
          await deleteOrder(db, orderToDelete.id)
          console.log('[useOrderManagement] clearOrder - draft order deleted successfully')
        } else if (dbOrder) {
          // Order exists but is not a draft (e.g., paid) - just clear state, don't delete
          console.log('[useOrderManagement] clearOrder - order is not a draft, skipping deletion:', dbOrder.status)
        } else {
          // Order doesn't exist in DB - nothing to delete
          console.log('[useOrderManagement] clearOrder - order not found in database, nothing to delete')
        }
        
        // Refetch open orders list to update the UI
        refetchOrders()
      } catch (error) {
        console.error('[useOrderManagement] clearOrder - error checking/deleting order:', error)
        // Don't throw - we've already cleared the state, so continue
        // Still refetch to ensure UI is up to date
        refetchOrders()
      }
    } else {
      // No order to delete - just refetch to ensure UI is up to date
      refetchOrders()
    }
  }, [refetchOrders])

  const saveDraft = useCallback(async () => {
    // Use ref to get the latest order state (avoids stale closure issues)
    const orderToSave = orderRef.current
    
    if (!orderToSave) {
      console.log('[useOrderManagement] saveDraft - no order to save')
      return
    }

    const db = await openDatabase()
    
    // Generate order number if not already generated (for new orders)
    let orderNumber = orderToSave.orderNumber
    if (!orderNumber || orderNumber.startsWith('ORD-TEMP-')) {
      // Get cash register code for order number generation
      const registration = getRegistration()
      let cashRegisterCode = 'CR-UNKNOWN' // Fallback
      
      // Try to get cash register code from registration or fetch from API
      if (registration?.cashRegisterCode) {
        cashRegisterCode = registration.cashRegisterCode
      } else if (registration?.cashRegisterId) {
        // Fetch cash register code from API
        try {
          const { apiClient } = await import('../api/client')
          const response = await apiClient.get(`/api/v1/cash_registers/${registration.cashRegisterId}`)
          cashRegisterCode = response.data.code
          // Store in registration for future use
          const updatedRegistration = { ...registration, cashRegisterCode }
          const { saveRegistration } = await import('../utils/registration')
          saveRegistration(updatedRegistration as any)
        } catch (error) {
          console.warn('[useOrderManagement] Failed to fetch cash register code, using fallback:', error)
        }
      }
      
      // Generate order number
      try {
        orderNumber = await generateOrderNumber(cashRegisterCode, storeId)
        // Update order with generated number
        setOrder(prev => prev ? { ...prev, orderNumber } : null)
      } catch (error) {
        console.error('[useOrderManagement] Failed to generate order number:', error)
        // Fallback to timestamp-based number
        orderNumber = `ORD-${Date.now()}`
      }
    }
    
    // Check if this is the first time saving to a table (order was on cash register, now has tableId)
    // We need to check the database to see if there was a previous version with tableId = null
    let wasCashRegisterOrder = false
    if (orderToSave.tableId !== null && orderToSave.tableId !== undefined) {
      try {
        const existingOrder = await getOrder(db, orderToSave.id || 0)
        // If order exists in DB with tableId = null, it was a cash register order
        wasCashRegisterOrder = existingOrder?.table_id === null || existingOrder?.table_id === undefined
      } catch (error) {
        // If order doesn't exist in DB, it's a new order being saved to table for first time
        // Check if current location is cash register
        wasCashRegisterOrder = currentLocation === 'cash_register'
      }
    }
    const isNowTableOrder = orderToSave.tableId !== null && orderToSave.tableId !== undefined
    const isFirstTimeSavingToTable = wasCashRegisterOrder && isNowTableOrder
    const isOnCashRegister = currentLocation === 'cash_register'
    
    // Recalculate totals before saving
    const totals = calculateTotals(orderToSave.items)
    
    // ALWAYS save locally first (for performance, even when online)
    console.log('[useOrderManagement] saveDraft - saving order with tableId:', orderToSave.tableId)
    const orderData = {
      id: orderToSave.id || 0, // Use 0 for unsynced orders
      order_number: orderNumber,
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
    
    // Refetch open orders list to update the UI
    refetchOrders()

    // If this is the first time saving to a table and we're still on cash register, clear the cash register order
    if (isFirstTimeSavingToTable && isOnCashRegister) {
      console.log('[useOrderManagement] saveDraft - order saved to table for first time, clearing cash register order')
      // Clear the order state to trigger loading the cash register order (which should be null now)
      setOrder(null)
      // The useEffect will automatically load the cash register order (which should be null)
    } else {
      // Update local order with recalculated totals (preserve tableId)
      setOrder((current) => {
        if (!current) return null
        return { ...current, ...totals }
      })
    }
  }, [calculateTotals, refetchOrders, currentLocation])

  // Auto-save order when it changes (but not on initial load or location change)
  useEffect(() => {
    // Skip auto-save if:
    // 1. This is the initial load
    // 2. Auto-save is disabled (during location changes)
    // 3. There's no order
    if (isInitialLoadRef.current || !shouldAutoSaveRef.current || !order) {
      return
    }

    // Auto-save the order after a short delay to batch rapid changes
    const timeoutId = setTimeout(() => {
      console.log('[useOrderManagement] Auto-saving order after change')
      saveDraft().catch((error) => {
        console.error('[useOrderManagement] Error auto-saving order:', error)
      })
    }, 300) // 300ms debounce to batch rapid changes

    return () => {
      clearTimeout(timeoutId)
    }
  }, [order?.items, order?.subtotal, order?.taxes, order?.total, order?.customerId, order?.tableId, saveDraft])

  const markAsPaid = useCallback(async (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => {
    // Use ref to get the latest order state (avoids stale closure issues)
    const currentOrder = orderRef.current
    if (!currentOrder) {
      console.error('[useOrderManagement] markAsPaid - no order to mark as paid')
      return
    }

    const db = await openDatabase()
    
    // Recalculate totals
    const totals = calculateTotals(currentOrder.items)
    
    // ALWAYS save locally first with paid status (for performance)
    const orderData = {
      id: currentOrder.id,
      order_number: currentOrder.orderNumber,
      store_id: currentOrder.storeId,
      customer_id: currentOrder.customerId,
      table_id: currentOrder.tableId ?? null,
      status: 'paid' as const,
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      discount: totals.discount,
      total: totals.total,
      sync_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('[useOrderManagement] markAsPaid - saving order as paid:', orderData.id, orderData.status)
    await saveOrder(db, orderData)
    console.log('[useOrderManagement] markAsPaid - order saved successfully')

    // Save order items
    for (const item of currentOrder.items) {
      await saveOrderItem(db, {
        id: item.id,
        order_id: currentOrder.id,
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
      data_id: currentOrder.id,
      data: {
        ...orderData,
        payment_method: paymentMethod,
        amount_paid: amountPaid,
      },
    })

    console.log('[useOrderManagement] markAsPaid - payment processed, order saved with paid status')

    // Update shift summary incrementally - CRITICAL: Must update when payment is made
    try {
      const currentShift = localStorage.getItem('pos_current_shift')
      if (currentShift) {
        const shiftData = JSON.parse(currentShift)
        if (shiftData.shift_number) {
          console.log('[useOrderManagement] Updating shift summary for shift:', shiftData.shift_number, 'payment method:', paymentMethod, 'total:', totals.total)
          await updateShiftSummaryOnPayment(
            shiftData.shift_number,
            {
              total: totals.total,
              items: currentOrder.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
            paymentMethod
          )
          console.log('[useOrderManagement] Shift summary updated successfully')
        } else {
          console.warn('[useOrderManagement] No shift_number found in current shift data')
        }
      } else {
        console.warn('[useOrderManagement] No current shift found in localStorage - cannot update shift summary')
      }
    } catch (error) {
      console.error('[useOrderManagement] Failed to update shift summary:', error)
      // Log the full error for debugging
      if (error instanceof Error) {
        console.error('[useOrderManagement] Error details:', error.message, error.stack)
      }
      // Don't fail the payment if summary update fails, but log warning
      console.warn('[useOrderManagement] Payment processed but shift summary update failed')
    }

    // Refetch open orders list to update the UI
    refetchOrders()
  }, [calculateTotals, refetchOrders])

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
    // Current order being edited
    order,
    totals,
    
    // Open orders list (for BottomBar)
    openOrders,
    refetchOrders,
    
    // Location management
    currentLocation,
    switchToLocation,
    switchToCashRegister,
    
    // Order operations
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setTable,
    clearOrder,
    saveDraft,
    markAsPaid,
    orderRefId,
  }
}
