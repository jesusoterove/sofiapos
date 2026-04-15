/**
 * Payment screen component with two-panel layout.
 */
import { useState, useEffect } from 'react'
import { Modal, Button, formatPrice } from '@sofiapos/ui'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { AmountPaidInput } from './AmountPaidInput'
import { ChangeDisplay } from './ChangeDisplay'
import { OrderTicketPanel } from './OrderTicketPanel'
import { NumericKeypad } from './NumericKeypad'
import { useTranslation } from '@/i18n/hooks'
import { useShiftContext } from '@/contexts/ShiftContext'
import type { Order } from '@/hooks/useOrderManagement'

interface PaymentScreenProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  orderTotal: number
  orderSubtotal: number
  orderTaxes: number
  orderDiscount: number
  onProcessPayment: (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number, shiftId: number | null) => void
  onPrintReceipt?: () => void
}

export function PaymentScreen({
  isOpen,
  onClose,
  order,
  orderTotal,
  orderSubtotal,
  orderTaxes,
  orderDiscount,
  onProcessPayment,
  onPrintReceipt,
}: PaymentScreenProps) {
  const { t } = useTranslation()
  const { currentShift } = useShiftContext()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [isCompactHeight, setIsCompactHeight] = useState(false)

  const change = parseFloat(amountPaid || '0') - orderTotal

  useEffect(() => {
    setAmountPaid('')
    setPaymentMethod('cash')
  }, [orderTotal])

  useEffect(() => {
    const updateCompactHeight = () => {
      setIsCompactHeight(window.innerHeight < 800)
    }

    updateCompactHeight()
    window.addEventListener('resize', updateCompactHeight)
    return () => window.removeEventListener('resize', updateCompactHeight)
  }, [])

  const handleNumberClick = (num: string) => {
    const newValue = amountPaid + num
    // Check decimal places
    if (newValue.includes('.')) {
      const parts = newValue.split('.')
      if (parts[1] && parts[1].length > 2) {
        return
      }
    }
    setAmountPaid(newValue)
  }

  const handleDecimalClick = () => {
    if (!amountPaid.includes('.')) {
      setAmountPaid(amountPaid ? amountPaid + '.' : '0.')
    }
  }

  const handleBackspace = () => {
    setAmountPaid(amountPaid.slice(0, -1))
  }

  const handleClear = () => {
    setAmountPaid('')
  }

  const handleQuickAmount = (amount: number) => {
    const current = parseFloat(amountPaid || '0')
    setAmountPaid((current + amount).toFixed(2))
  }

  const handleExact = () => {
    setAmountPaid(orderTotal.toFixed(2))
  }

  const handleProcessPayment = () => {
    const paid = parseFloat(amountPaid || '0')
    if (paid >= orderTotal) {
      // Get shiftId from currentShift (required for payment processing)
      // Convert to number if it's a string
      const shiftId = currentShift?.id 
        ? (typeof currentShift.id === 'number' ? currentShift.id : parseInt(String(currentShift.id), 10))
        : null
      onProcessPayment(paymentMethod, paid, shiftId)
    }
  }

  const handlePrint = () => {
    if (onPrintReceipt) {
      onPrintReceipt()
    }
  }

  const handleClose = () => {
    // setAmountPaid('')
    // setPaymentMethod('cash')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      hideTitle={true}
      showCloseButton={false}
      title={t('payment.title') || 'Payment'}
      size="xl"
      className={isCompactHeight ? 'max-h-[96vh]' : ''}
      bodyClassName={isCompactHeight ? 'overflow-hidden p-3' : ''}
    >
      <div className={`flex min-h-0 ${isCompactHeight ? 'h-[calc(96vh-1.5rem)]' : 'h-[80vh]'}`}>
        {/* Left Panel: Order Details */}
        <div className="w-1/2 min-h-0 border-r" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
          <OrderTicketPanel
            order={order}
            totals={{
              subtotal: orderSubtotal,
              taxes: orderTaxes,
              discount: orderDiscount,
              total: orderTotal,
            }}
          />
        </div>

        {/* Right Panel: Payment Controls */}
        <div className={`w-1/2 min-h-0 flex flex-col overflow-y-auto ${isCompactHeight ? 'p-2 pt-0 space-y-2' : 'p-3 pt-0 space-y-3'}`}>
          {/* Payment Method Toggle */}
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} isCompact={isCompactHeight} />

          {/* Total Display */}
          <div className="flex items-center gap-2 border-b" style={{ borderBottomColor: 'var(--color-border-default, #E5E7EB)' }}>
            <label className={isCompactHeight ? 'text-base font-medium' : 'text-lg font-medium'} style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('common.total') || 'Total'}: 
            </label>
            <div
              className={`flex-1 font-bold text-right ${isCompactHeight ? 'h-9 text-xl px-2 py-0' : 'h-10 text-2xl px-4 py-0'}`}
              style={{
                backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
                color: 'var(--color-text-primary, #111827)',
              }}
            >
              {formatPrice(orderTotal, 'en-US', 'USD', 2)}
            </div>
          </div>

          {/* Tendered Amount Input */}
          <div className="flex items-center gap-2 border-b" style={{ borderBottomColor: 'var(--color-border-default, #E5E7EB)' }}>
            <label className={isCompactHeight ? 'text-base font-medium' : 'text-lg font-medium'} style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('payment.tenderedAmount') || 'Tendered amount: $'}
            </label>
            <AmountPaidInput
              value={amountPaid}
              label="" // Empty label since we're showing it separately
              isCompact={isCompactHeight}
            />
          </div>

          {/* Change Display (always visible, disabled when not cash) */}
          <ChangeDisplay change={change} disabled={paymentMethod !== 'cash'} isCompact={isCompactHeight} />

          {/* Numeric Keypad */}
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDecimalClick={handleDecimalClick}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onQuickAmount={handleQuickAmount}
            onExact={handleExact}
            onPrint={handlePrint}
            isCompact={isCompactHeight}
          />

          {/* Right Side Buttons: PAY and CANCEL */}
          <div className={`flex gap-2 mt-auto ${isCompactHeight ? 'pt-1' : ''}`}>
            <Button
              variant="primary"
              onClick={handleProcessPayment}
              disabled={!amountPaid || parseFloat(amountPaid || '0') < orderTotal}
              className={`flex-1 font-bold ${isCompactHeight ? 'h-11 text-base' : 'h-14 text-lg'}`}
            >
              {t('payment.pay') || 'PAY'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClose}
              className={`flex-1 font-bold ${isCompactHeight ? 'h-11 text-base' : 'h-14 text-lg'}`}
            >
              {t('payment.cancel') || 'CANCEL'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
