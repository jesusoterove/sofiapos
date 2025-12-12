/**
 * Close Shift Confirmation Modal
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Modal, Button, Input } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface CloseShiftModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CloseShiftModal({ isOpen, onClose }: CloseShiftModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [finalCash, setFinalCash] = useState('')

  const handleConfirm = () => {
    // Navigate to close-shift page
    navigate({ to: '/app/close-shift', replace: false })
    onClose()
  }

  const handleCancel = () => {
    setFinalCash('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('shift.closeShift') || 'Close Shift'}
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-50, #FEF3C7)', border: '1px solid var(--color-warning-200, #FDE68A)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-warning-800, #92400E)' }}>
            {t('shift.closeShiftWarning') || 'Warning: This action cannot be reversed. Please ensure all data is correct before proceeding.'}
          </p>
        </div>

        <Input
          type="number"
          label={t('shift.finalCash') || 'Final Cash Amount'}
          value={finalCash}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinalCash(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          fullWidth
        />

        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <Button variant="secondary" onClick={handleCancel} className="flex-1">
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            disabled={!finalCash || parseFloat(finalCash) < 0}
          >
            {t('common.confirm') || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

