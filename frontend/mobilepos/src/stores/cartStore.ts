import { create } from 'zustand'

export interface CartItem {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  taxAmount: number
  unitOfMeasureId?: number
}

export interface CartTotals {
  subtotal: number
  taxes: number
  discount: number
  total: number
}

interface CartState {
  items: CartItem[]
  customerId?: number
  tableId?: number | null
  orderNumber: string | null

  addItem: (product: { id: number; name: string; selling_price: number; tax_rate: number; unitOfMeasureId?: number }) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  setCustomer: (customerId?: number) => void
  setTable: (tableId?: number | null) => void
  setOrderNumber: (orderNumber: string) => void
  loadOrder: (items: CartItem[], orderNumber: string, customerId?: number, tableId?: number | null) => void
  clear: () => void

  getTotals: () => CartTotals
}

function calculateTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxes = items.reduce((sum, item) => sum + item.taxAmount, 0)
  const discount = 0
  const total = subtotal + taxes - discount
  return { subtotal, taxes, discount, total }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: undefined,
  tableId: undefined,
  orderNumber: null,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id)
      if (existing) {
        const newItems = state.items.map((item) => {
          if (item.productId === product.id) {
            const newQty = item.quantity + 1
            const newTotal = newQty * item.unitPrice
            const newTax = newTotal * item.taxRate
            return { ...item, quantity: newQty, total: newTotal, taxAmount: newTax }
          }
          return item
        })
        return { items: newItems }
      }

      const itemTotal = product.selling_price
      const taxAmount = itemTotal * (product.tax_rate || 0)
      const newItem: CartItem = {
        id: `item-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.selling_price,
        taxRate: product.tax_rate || 0,
        total: itemTotal,
        taxAmount,
        unitOfMeasureId: product.unitOfMeasureId,
      }
      return { items: [...state.items, newItem] }
    })
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === itemId) {
          const newTotal = quantity * item.unitPrice
          const newTax = newTotal * item.taxRate
          return { ...item, quantity, total: newTotal, taxAmount: newTax }
        }
        return item
      }),
    }))
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }))
  },

  setCustomer: (customerId) => set({ customerId }),
  setTable: (tableId) => set({ tableId }),
  setOrderNumber: (orderNumber) => set({ orderNumber }),

  loadOrder: (items, orderNumber, customerId, tableId) => {
    set({ items, orderNumber, customerId, tableId })
  },

  clear: () => set({ items: [], customerId: undefined, tableId: undefined, orderNumber: null }),

  getTotals: () => calculateTotals(get().items),
}))
