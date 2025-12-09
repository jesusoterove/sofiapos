/**
 * Payment screen component with two-panel layout.
 */
import { useState } from 'react'
import { Modal, Button } from '@sofiapos/ui'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { AmountPaidInput } from './AmountPaidInput'
import { ChangeDisplay } from './ChangeDisplay'
import { OrderTicketPanel } from './OrderTicketPanel'
import { NumericKeypad } from './NumericKeypad'
import { useTranslation } from '@/i18n/hooks'
import type { Order } from '@/hooks/useOrderManagement'

interface PaymentScreenProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  orderTotal: number
  orderSubtotal: number
  orderTaxes: number
  orderDiscount: number
  onProcessPayment: (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => void
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [amountPaid, setAmountPaid] = useState('')

  const change = parseFloat(amountPaid || '0') - orderTotal

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
      onProcessPayment(paymentMethod, paid)
      setAmountPaid('')
      setPaymentMethod('cash')
    }
  }

  const handlePrint = () => {
    if (onPrintReceipt) {
      onPrintReceipt()
    }
  }

  const handleClose = () => {
    setAmountPaid('')
    setPaymentMethod('cash')
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
    >
      <div className="flex h-[80vh]">
        {/* Left Panel: Order Details */}
        <div className="w-1/2 border-r" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
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
        <div className="w-1/2 flex flex-col p-3 pt-0 space-y-4 overflow-y-auto">
          {/* Payment Method Toggle */}
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          {/* Tendered Amount Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('payment.tenderedAmount') || 'Tendered amount: $'}
            </label>
            <AmountPaidInput
              value={amountPaid}
              label="" // Empty label since we're showing it separately
            />
          </div>

          {/* Change Display (always visible, disabled when not cash) */}
          <ChangeDisplay change={change} disabled={paymentMethod !== 'cash'} />

          {/* Numeric Keypad */}
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDecimalClick={handleDecimalClick}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onQuickAmount={handleQuickAmount}
          />

          {/* Bottom Buttons: EXACT and PRINT */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExact}
              className="flex-1"
            >
              {t('payment.exact') || 'EXACT'}
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrint}
              className="flex-1"
            >
              {t('payment.print') || 'PRINT'}
            </Button>
          </div>

          {/* Right Side Buttons: PAY and CANCEL */}
          <div className="flex gap-2 mt-auto">
            <Button
              variant="primary"
              onClick={handleProcessPayment}
              disabled={!amountPaid || parseFloat(amountPaid || '0') < orderTotal}
              className="flex-1 h-14 text-lg font-bold"
            >
              {t('payment.pay') || 'PAY'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1 h-14 text-lg font-bold"
            >
              {t('payment.cancel') || 'CANCEL'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
