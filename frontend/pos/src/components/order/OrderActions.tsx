/**
 * Order actions component.
 */
import { Button, messageBox } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface OrderActionsProps {
  hasItems: boolean
  onSaveDraft: () => void
  onPay: () => void
  onCancel: () => void
}

export function OrderActions({ hasItems, onSaveDraft, onPay, onCancel }: OrderActionsProps) {
  const { t } = useTranslation()

  const handleCancel = async () => {
    const result = await messageBox.ask(
      t('order.cancelOrderConfirmMessage') || 'Are you sure you want to cancel this order? All items will be removed.',
      t('order.cancelOrderConfirmTitle') || 'Cancel Order',
      'YesNo'
    )

    if (result.button === 'Yes') {
      onCancel()
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={onSaveDraft}
        disabled={!hasItems}
        className="flex-1"
      >
        {t('order.saveDraft') || 'Save Draft'}
      </Button>
      <Button
        variant="primary"
        onClick={onPay}
        disabled={!hasItems}
        className="flex-1"
      >
        {t('common.pay') || 'Pay'}
      </Button>
      <Button
        variant="danger"
        onClick={handleCancel}
        className="flex-1"
      >
        {t('order.cancelOrder') || 'Cancel'}
      </Button>
    </div>
  )
}

