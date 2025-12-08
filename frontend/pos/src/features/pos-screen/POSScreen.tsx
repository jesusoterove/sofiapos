/**
 * Main POS screen component.
 * 
 * Flow:
 * 1. Check if shift is open
 *    - If yes → enable order processing
 *    - If no → navigate to open_shift
 */
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { ProductSelectionPanel } from '@/components/product-selection/ProductSelectionPanel'
import { OrderDetailsPanel } from '@/components/order/OrderDetailsPanel'
import { PaymentScreen } from '@/components/payment/PaymentScreen'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import { useOrders } from '@/hooks/useOrders'
import { useShift } from '@/hooks/useShift'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'

const STORE_ID = 1 // TODO: Get from context/settings

export function POSScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPaymentScreen, setShowPaymentScreen] = useState(false)
  const [isOperationsEnabled, setIsOperationsEnabled] = useState(false)
  const [hasCheckedShift, setHasCheckedShift] = useState(false)
  
  const { currentLocation, switchToCashRegister, refetchOrders } = useOrders(STORE_ID)
  const { hasOpenShift, isLoading: shiftLoading } = useShift()
  
  const {
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
  } = useOrderManagement(STORE_ID, currentLocation)

  // Check if shift is open
  useEffect(() => {
    if (hasCheckedShift || shiftLoading) return
    
    setHasCheckedShift(true)
    
    if (!hasOpenShift) {
      // No open shift - navigate to open shift page
      navigate({ to: '/open-shift', replace: true })
      return
    }
    
    // Shift is open - enable operations
    setIsOperationsEnabled(true)
  }, [hasOpenShift, shiftLoading, hasCheckedShift, navigate])

  const handleProductSelect = (product: any) => {
    addItem(product)
  }

  const handlePayment = () => {
    if (!order || order.items.length === 0) {
      toast.error(t('order.noItems') || 'No items in order')
      return
    }
    setShowPaymentScreen(true)
  }

  const handleProcessPayment = async (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => {
    try {
      // ALWAYS save locally first (for performance, even when online)
      await markAsPaid(paymentMethod, amountPaid)
      
      toast.success(t('payment.processPayment') || 'Payment processed successfully')
      setShowPaymentScreen(false)
      clearOrder()
      // Refresh orders list
      refetchOrders()
      // Switch to cash register if order was from a table
      if (order?.tableId) {
        switchToCashRegister()
      }
    } catch (error) {
      toast.error(t('common.error') || 'Error processing payment')
      console.error('Payment error:', error)
    }
  }

  const handleCancelOrder = () => {
    clearOrder()
    // Switch to cash register when order is cancelled
    switchToCashRegister()
    // Refresh orders list
    refetchOrders()
  }

  return (
    <POSLayout>
      {/* Disable operations if not enabled */}
      <div className="flex-1 flex overflow-hidden" style={{ opacity: isOperationsEnabled ? 1 : 0.5, pointerEvents: isOperationsEnabled ? 'auto' : 'none' }}>
        <ProductSelectionPanel onProductSelect={handleProductSelect} />
        <OrderDetailsPanel
          order={order}
          totals={totals}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onSetCustomer={setCustomer}
          onSetTable={setTable}
          onClearOrder={handleCancelOrder}
          onSaveDraft={saveDraft}
          onPayment={handlePayment}
          storeId={STORE_ID}
        />
      </div>
      
      <PaymentScreen
        isOpen={showPaymentScreen}
        onClose={() => setShowPaymentScreen(false)}
        orderTotal={totals.total}
        orderSubtotal={totals.subtotal}
        orderTaxes={totals.taxes}
        onProcessPayment={handleProcessPayment}
      />
    </POSLayout>
  )
}

