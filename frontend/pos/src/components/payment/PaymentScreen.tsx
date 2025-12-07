/**
 * Payment screen component.
 */
import React, { useState } from 'react'
import { Modal } from '@sofiapos/ui'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { AmountPaidInput } from './AmountPaidInput'
import { ChangeDisplay } from './ChangeDisplay'
import { PaymentSummary } from './PaymentSummary'
import { Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface PaymentScreenProps {
  isOpen: boolean
  onClose: () => void
  orderTotal: number
  orderSubtotal: number
  orderTaxes: number
  onProcessPayment: (paymentMethod: 'cash' | 'bank_transfer', amountPaid: number) => void
}

export function PaymentScreen({
  isOpen,
  onClose,
  orderTotal,
  orderSubtotal,
  orderTaxes,
  onProcessPayment,
}: PaymentScreenProps) {
  const { t } = useTranslation()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [amountPaid, setAmountPaid] = useState('')

  const change = parseFloat(amountPaid) - orderTotal

  const handleProcessPayment = () => {
    if (parseFloat(amountPaid) >= orderTotal) {
      onProcessPayment(paymentMethod, parseFloat(amountPaid))
      setAmountPaid('')
      setPaymentMethod('cash')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('payment.title') || 'Payment'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Order Total */}
        <div className="text-center">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {t('payment.orderTotal') || 'Order Total'}
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-primary-500, #3B82F6)' }}>
            ${orderTotal.toFixed(2)}
          </div>
        </div>

        {/* Payment Method and Amount Paid */}
        <div className="grid grid-cols-2 gap-4">
          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
          />
          <AmountPaidInput
            value={amountPaid}
            onChange={setAmountPaid}
            orderTotal={orderTotal}
          />
        </div>

        {/* Change Display */}
        {paymentMethod === 'cash' && amountPaid && (
          <ChangeDisplay change={change} />
        )}

        {/* Payment Summary */}
        <PaymentSummary
          subtotal={orderSubtotal}
          taxes={orderTaxes}
          total={orderTotal}
          amountPaid={parseFloat(amountPaid) || 0}
          change={change}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {t('payment.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleProcessPayment}
            disabled={!amountPaid || parseFloat(amountPaid) < orderTotal}
            className="flex-1"
          >
            {t('payment.processPayment') || 'Process Payment'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

