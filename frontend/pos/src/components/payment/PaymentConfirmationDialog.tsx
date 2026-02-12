/**
 * Payment confirmation dialog shown after payment is processed.
 * Displays Total, Tendered Amount, Change, and a Print Receipt toggle (default from config).
 */
import { useState, useEffect } from 'react'
import { Modal, Button, formatPrice } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { getPrintReceiptConfig } from '@/services/cashDrawer'

interface PaymentConfirmationDialogProps {
  isOpen: boolean
  total: number
  tenderedAmount: number
  change: number
  onAccept: (shouldPrintReceipt: boolean) => void | Promise<void>
}

export function PaymentConfirmationDialog({
  isOpen,
  total,
  tenderedAmount,
  change,
  onAccept,
}: PaymentConfirmationDialogProps) {
  const { t } = useTranslation()
  const [printReceipt, setPrintReceipt] = useState(false)
  const [printReceiptAvailable, setPrintReceiptAvailable] = useState(false)

  useEffect(() => {
    if (isOpen) {
      getPrintReceiptConfig().then((config) => {
        setPrintReceiptAvailable(config.enabled)
        setPrintReceipt(config.defaultChecked)
      })
    }
  }, [isOpen])

  const handleAccept = async () => {
    await onAccept(printReceipt && printReceiptAvailable)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      hideTitle={false}
      showCloseButton={false}
      title={t('payment.confirmationTitle') || 'Payment Complete'}
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b" style={{ borderBottomColor: 'var(--color-border-default, #E5E7EB)' }}>
            <label className="text-lg font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('common.total') || 'Total'}:
            </label>
            <div
              className="flex-1 h-10 text-2xl font-bold text-right px-4 py-0"
              style={{ backgroundColor: 'var(--color-bg-paper, #FFFFFF)', color: 'var(--color-text-primary, #111827)' }}
            >
              {formatPrice(total, 'en-US', 'USD', 2)}
            </div>
          </div>
          <div className="flex items-center gap-2 border-b" style={{ borderBottomColor: 'var(--color-border-default, #E5E7EB)' }}>
            <label className="text-lg font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('payment.tenderedAmount') || 'Tendered amount'}
            </label>
            <div
              className="flex-1 h-10 text-2xl font-bold text-right px-4 py-0"
              style={{ backgroundColor: 'var(--color-bg-paper, #FFFFFF)', color: 'var(--color-text-primary, #111827)' }}
            >
              {formatPrice(tenderedAmount, 'en-US', 'USD', 2)}
            </div>
          </div>
          <div className="flex items-center gap-2 border-b" style={{ borderBottomColor: 'var(--color-border-default, #E5E7EB)' }}>
            <label className="text-lg font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('payment.change') || 'Change'}
            </label>
            <div
              className="flex-1 h-10 text-2xl font-bold text-right px-4 py-0"
              style={{ backgroundColor: 'var(--color-bg-paper, #FFFFFF)', color: 'var(--color-success-600, #16A34A)' }}
            >
              {formatPrice(Math.max(0, change), 'en-US', 'USD', 2)}
            </div>
          </div>
        </div>

        {printReceiptAvailable && (
          <div className="flex items-center gap-2 pt-2" style={{ borderColor: 'var(--color-border-default)' }}>
            <input
              type="checkbox"
              id="print_receipt_confirm"
              checked={printReceipt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrintReceipt(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="print_receipt_confirm" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.cashDrawer.printReceipt') || t('order.printReceipt') || 'Print Receipt'}
            </label>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={handleAccept}>
            {t('payment.accept') || 'Accept'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
