/**
 * Hook for managing multiple orders (cash register and table orders).
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { openDatabase } from '../db'
import { getAllOrders, getOrderItems } from '../db/queries/orders'
import type { Order } from './useOrderManagement'

export type OrderLocation = 'cash_register' | { type: 'table'; tableId: number }

export interface OpenOrder {
  id: string
  orderNumber: string
  tableId?: number | null
  total: number
  itemCount: number
  location: OrderLocation
}

export function useOrders(storeId: number) {
  const [currentLocation, setCurrentLocation] = useState<OrderLocation>('cash_register')

  // Fetch open (draft) orders
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

  const switchToLocation = useCallback((location: OrderLocation) => {
    setCurrentLocation(location)
  }, [])

  const switchToCashRegister = useCallback(() => {
    setCurrentLocation('cash_register')
  }, [])

  return {
    openOrders,
    currentLocation,
    switchToLocation,
    switchToCashRegister,
    refetchOrders,
  }
}

