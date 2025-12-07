/**
 * Main POS screen component.
 */
import React, { useState } from 'react'
import { POSLayout } from '@/components/layout/POSLayout'
import { ProductSelectionPanel } from '@/components/product-selection/ProductSelectionPanel'
import { OrderDetailsPanel } from '@/components/order/OrderDetailsPanel'
import { PaymentScreen } from '@/components/payment/PaymentScreen'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'

const STORE_ID = 1 // TODO: Get from context/settings

export function POSScreen() {
  const { t } = useTranslation()
  const [showPaymentScreen, setShowPaymentScreen] = useState(false)
  const {
    order,
    totals,
    addItem,
    clearOrder,
    saveDraft,
  } = useOrderManagement(STORE_ID)

  const handleProductSelect = (product: any) => {
    addItem(product)
    toast.success(t('common.add') || 'Added to order')
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
      // TODO: Process payment through API
      console.log('Processing payment:', { paymentMethod, amountPaid, order })
      
      // Save order as paid
      await saveDraft()
      
      toast.success(t('payment.processPayment') || 'Payment processed successfully')
      setShowPaymentScreen(false)
      clearOrder()
    } catch (error) {
      toast.error(t('common.error') || 'Error processing payment')
      console.error('Payment error:', error)
    }
  }

  return (
    <POSLayout>
      <ProductSelectionPanel onProductSelect={handleProductSelect} />
      <OrderDetailsPanel
        storeId={STORE_ID}
        onPayment={handlePayment}
      />
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

