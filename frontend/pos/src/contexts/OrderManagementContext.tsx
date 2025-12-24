/**
 * Context provider for order management.
 * This ensures the order state persists even if POSScreen remounts.
 */
import { createContext, useContext, ReactNode } from 'react'
import { useOrderManagement, type Order, type OpenOrder, type OrderLocation } from '@/hooks/useOrderManagement'

interface OrderManagementContextValue {
  // Current order being edited
  order: Order | null
  totals: {
    subtotal: number
    taxes: number
    discount: number
    total: number
  }
  
  // Open orders list (for BottomBar)
  openOrders: OpenOrder[]
  refetchOrders: () => void
  
  // Location management
  currentLocation: OrderLocation
  switchToLocation: (location: OrderLocation) => Promise<void>
  switchToCashRegister: () => Promise<void>
  
  // Order operations
  addItem: (product: { id: number; name: string; selling_price: number; tax_rate: number }) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  setCustomer: (customerId?: number) => void
  setTable: (tableId?: number | null) => void
  clearOrder: () => Promise<void>
  saveDraft: () => Promise<void>
  markAsPaid: (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number, shiftId: number | null) => Promise<void>
  orderRefId: string | null
}

const OrderManagementContext = createContext<OrderManagementContextValue | undefined>(undefined)

interface OrderManagementProviderProps {
  children: ReactNode
  storeId: number
}

export function OrderManagementProvider({ children, storeId }: OrderManagementProviderProps) {
  const orderManagement = useOrderManagement(storeId)

  return (
    <OrderManagementContext.Provider value={orderManagement}>
      {children}
    </OrderManagementContext.Provider>
  )
}

export function useOrderManagementContext() {
  const context = useContext(OrderManagementContext)
  if (context === undefined) {
    throw new Error('useOrderManagementContext must be used within an OrderManagementProvider')
  }
  return context
}

