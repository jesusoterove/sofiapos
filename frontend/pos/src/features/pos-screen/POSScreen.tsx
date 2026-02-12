/**
 * Main POS screen component.
 * 
 * Flow:
 * 1. Check if shift is open
 *    - If yes → enable order processing
 *    - If no → disable product selection and order details panels (but keep top bar buttons available)
 */
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { ProductSelectionPanel } from '@/components/product-selection/ProductSelectionPanel'
import { OrderDetailsPanel } from '@/components/order/OrderDetailsPanel'
import { PaymentScreen } from '@/components/payment/PaymentScreen'
import { PaymentConfirmationDialog } from '@/components/payment/PaymentConfirmationDialog'
import { useOrderManagementContext } from '@/contexts/OrderManagementContext'
import { useShiftContext } from '@/contexts/ShiftContext'
import { useProductSelection } from '@/hooks/useProductSelection'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { getRegistration } from '@/utils/registration'
import { openCashDrawer, getPrintReceiptConfig } from '@/services/cashDrawer'
import { printReceipt } from '@/services/receiptPrint'

export function POSScreen() {
  // Get store ID from registration
  const registration = getRegistration()
  const storeId = registration?.storeId || 1 // Fallback to 1 if not registered yet
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showPaymentScreen, setShowPaymentScreen] = useState(false)
  const [showPaymentConfirmationDialog, setShowPaymentConfirmationDialog] = useState(false)
  const [paymentConfirmationData, setPaymentConfirmationData] = useState<{
    total: number
    tenderedAmount: number
    change: number
  } | null>(null)
  const { clearSearch } = useProductSelection()
  
  const { hasOpenShift, isLoading: shiftLoading } = useShiftContext()
  
  useEffect(() => {
    console.log('HAS OPEN SHIFT CHANGED', hasOpenShift);
  }, [hasOpenShift])
  // Enable operations only when shift is open and loaded
  const isOperationsEnabled = !shiftLoading && hasOpenShift
  
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

  const handleProcessPayment = async (
    paymentMethod: 'cash' | 'bank_transfer',
    amountPaid: number,
    shiftId: number | null
  ) => {
    try {
      await markAsPaid(paymentMethod, amountPaid, shiftId)

      if (paymentMethod === 'cash') {
        await openCashDrawer()
      }

      const change = amountPaid - totals.total
      setPaymentConfirmationData({
        total: totals.total,
        tenderedAmount: amountPaid,
        change,
      })
      setShowPaymentConfirmationDialog(true)
    } catch (error) {
      toast.error(t('common.error') || 'Error processing payment')
      console.error('Payment error:', error)
    }
  }

  const handlePaymentConfirmationAccept = async (shouldPrintReceipt: boolean) => {
    try {
      if (shouldPrintReceipt && order) {
        try {
          const config = await getPrintReceiptConfig()
          if (config.enabled && config.printerName) {
            await printReceipt(order, totals, config.printerName)
            toast.success(t('payment.printReceiptSuccess') || 'Receipt printed')
          }
        } catch (printError) {
          console.error('Receipt print failed:', printError)
          toast.error(t('payment.printReceiptError') || 'Failed to print receipt.')
        }
      }
    } finally {
      setShowPaymentConfirmationDialog(false)
      setPaymentConfirmationData(null)
      setShowPaymentScreen(false)
      clearOrder()
      clearSearch()
      refetchOrders()
      if (order?.tableId) {
        switchToCashRegister()
      }
    }
  }

  const handlePrintReceipt = () => {
    // TODO: Implement receipt printing
    console.log('Print receipt for order:', order)
    toast.info(t('payment.printReceipt') || 'Printing receipt...')
  }

  const handleCancelOrder = async () => {
    await clearOrder()
    clearSearch() // Clear product selection search
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
    navigate({ to: '/app/sales-invoices', replace: false })
  }

  return (
    <POSLayout onSalesInvoicesClick={handleSalesInvoicesClick}>
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
      {paymentConfirmationData && (
        <PaymentConfirmationDialog
          isOpen={showPaymentConfirmationDialog}
          total={paymentConfirmationData.total}
          tenderedAmount={paymentConfirmationData.tenderedAmount}
          change={paymentConfirmationData.change}
          onAccept={handlePaymentConfirmationAccept}
        />
      )}
    </POSLayout>
  )
}

