/**
 * Main POS screen component.
 * 
 * Flow:
 * 1. Check if shift is open
 *    - If yes → enable order processing
 *    - If no → navigate to open_shift
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { ProductSelectionPanel } from '@/components/product-selection/ProductSelectionPanel'
import { OrderDetailsPanel } from '@/components/order/OrderDetailsPanel'
import { PaymentScreen } from '@/components/payment/PaymentScreen'
import { SalesInvoicesView } from '@/components/sales/SalesInvoicesView'
import { useOrderManagementContext } from '@/contexts/OrderManagementContext'
import { useShift } from '@/hooks/useShift'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { getRegistration } from '@/utils/registration'

export function POSScreen() {
  // Get store ID from registration
  const registration = getRegistration()
  const storeId = registration?.storeId || 1 // Fallback to 1 if not registered yet
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPaymentScreen, setShowPaymentScreen] = useState(false)
  const [isOperationsEnabled, setIsOperationsEnabled] = useState(false)
  const [hasCheckedShift, setHasCheckedShift] = useState(false)
  const [currentView, setCurrentView] = useState<'pos' | 'invoices'>('pos')
  const hasNavigatedRef = useRef(false)
  const navigationCountRef = useRef(0)
  
  const { hasOpenShift, isLoading: shiftLoading } = useShift()
  
  // Use context instead of hook directly - this ensures state persists across remounts
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
    switchToCashRegister,
    refetchOrders,
  } = useOrderManagementContext()

  // Debug: Log when order changes in POSScreen
  useEffect(() => {
    console.log('[POSScreen] order prop received:', {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      tableId: order?.tableId,
      itemCount: order?.items?.length || 0,
      orderReference: order,
    })
  }, [order])

  // Check if shift is open - only run once when shift loading completes
  useEffect(() => {
    // EMERGENCY STOP: Check if circuit breaker is disabled
    if (localStorage.getItem('pos_navigation_circuit_breaker') === 'disabled') {
      console.error('[POSScreen] CIRCUIT BREAKER DISABLED - Navigation stopped')
      return
    }

    console.log('[POSScreen] Shift check effect triggered', {
      hasCheckedShift,
      shiftLoading,
      hasOpenShift,
      navigationCount: navigationCountRef.current,
      timestamp: new Date().toISOString(),
    })

    // Circuit breaker: Stop if we've navigated too many times
    if (navigationCountRef.current >= 3) {
      console.error('[POSScreen] CIRCUIT BREAKER: Too many navigations - stopping loop')
      localStorage.setItem('pos_navigation_circuit_breaker', 'disabled')
      return
    }

    // CRITICAL: Don't check again if already checked (prevents loops)
    if (hasCheckedShift) {
      console.log('[POSScreen] Shift already checked, skipping')
      return
    }

    // Wait for shift to finish loading
    if (shiftLoading) {
      console.log('[POSScreen] Shift still loading, skipping')
      return
    }
    
    // Prevent multiple navigations in the same render cycle
    if (hasNavigatedRef.current) {
      console.log('[POSScreen] Already navigated in this effect, skipping')
      return
    }
    
    console.log('[POSScreen] Performing shift check', { hasOpenShift })
    
    // Mark as checked BEFORE any async operations or state changes
    setHasCheckedShift(true)
    
    if (!hasOpenShift) {
      // No open shift - navigate to open shift page
      // Check global navigation count first
      const globalCount = parseInt(localStorage.getItem('pos_global_nav_count') || '0', 10)
      if (globalCount >= 15) {
        console.error('[POSScreen] GLOBAL CIRCUIT BREAKER: Too many navigations - stopping')
        localStorage.setItem('pos_navigation_circuit_breaker', 'disabled')
        return
      }

      console.log('[POSScreen] No open shift, navigating to /app/open-shift')
      hasNavigatedRef.current = true
      navigationCountRef.current++
      const newGlobalCount = globalCount + 1
      localStorage.setItem('pos_global_nav_count', newGlobalCount.toString())
      
      // Log navigation
      const logs = JSON.parse(localStorage.getItem('pos_navigation_log') || '[]')
      logs.push({
        timestamp: new Date().toISOString(),
        component: 'POSScreen',
        from: '/app',
        to: '/app/open-shift',
        reason: `No open shift. hasOpenShift: ${hasOpenShift}, shiftLoading: ${shiftLoading}`,
        state: { hasOpenShift, shiftLoading, hasCheckedShift: true, globalCount: newGlobalCount }
      })
      if (logs.length > 50) logs.shift()
      localStorage.setItem('pos_navigation_log', JSON.stringify(logs))

      navigate({ to: '/app/open-shift', replace: true })
      return
    }
    
    // Shift is open - enable operations
    console.log('[POSScreen] Shift is open, enabling operations')
    setIsOperationsEnabled(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpenShift, shiftLoading]) // REMOVED hasCheckedShift from dependencies to prevent loops
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

  const handlePrintReceipt = () => {
    // TODO: Implement receipt printing
    console.log('Print receipt for order:', order)
    toast.info(t('payment.printReceipt') || 'Printing receipt...')
  }

  const handleCancelOrder = async () => {
    await clearOrder()
    // Switch to cash register when order is cancelled
    switchToCashRegister()
    // Refresh orders list (clearOrder already calls refetchOrders, but keep this for safety)
    refetchOrders()
  }

  const handleOrderSaved = () => {
    // Refresh orders list after saving draft
    refetchOrders()
  }

  const handleSalesInvoicesClick = () => {
    setCurrentView('invoices')
  }

  const handleBackToPOS = () => {
    setCurrentView('pos')
  }

  return (
    <POSLayout onSalesInvoicesClick={handleSalesInvoicesClick} onHomeClick={handleBackToPOS}>
      {currentView === 'invoices' ? (
        <SalesInvoicesView onBack={handleBackToPOS} />
      ) : (
        <>
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
              onOrderSaved={handleOrderSaved}
              storeId={storeId}
            />
          </div>
          
          <PaymentScreen
            isOpen={showPaymentScreen}
            onClose={() => setShowPaymentScreen(false)}
            order={order}
            orderTotal={totals.total}
            orderSubtotal={totals.subtotal}
            orderTaxes={totals.taxes}
            orderDiscount={totals.discount}
            onProcessPayment={handleProcessPayment}
            onPrintReceipt={handlePrintReceipt}
          />
        </>
      )}
    </POSLayout>
  )
}

