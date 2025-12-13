/**
 * Change Shift Modal - handles both opening and closing shifts.
 * Displays different content based on current shift status.
 */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Modal, Button, Input } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useShiftContext } from '@/contexts/ShiftContext'

interface ChangeShiftModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangeShiftModal({ isOpen, onClose }: ChangeShiftModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasOpenShift } = useShiftContext()
  const [finalCash, setFinalCash] = useState('')
  const [initialCash, setInitialCash] = useState('')

  const handleCloseShift = () => {
    // Navigate to close-shift page with finalCash as search param
    navigate({ 
      to: '/app/close-shift', 
      search: { finalCash: finalCash || undefined },
      replace: false 
    })
    setFinalCash('')
    onClose()
  }

  const handleOpenShift = () => {
    // Navigate to open-shift page with initialCash as search param
    navigate({ 
      to: '/app/open-shift', 
      search: { initialCash: initialCash || undefined },
      replace: false 
    })
    setInitialCash('')
    onClose()
  }

  const handleCancel = () => {
    setFinalCash('')
    setInitialCash('')
    onClose()
  }

  // If shift is open, show close shift modal
  if (hasOpenShift) {
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
              onClick={handleCloseShift}
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

  // If shift is not open, show open shift modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('shift.openShift') || 'Open Shift'}
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info-50, #EFF6FF)', border: '1px solid var(--color-info-200, #BFDBFE)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-info-800, #1E40AF)' }}>
            {t('shift.openShiftInfo') || 'Enter the initial cash amount to start a new shift.'}
          </p>
        </div>

        <Input
          type="number"
          label={t('shift.initialCash') || 'Initial Cash Amount'}
          value={initialCash}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialCash(e.target.value)}
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
            onClick={handleOpenShift}
            className="flex-1"
            disabled={!initialCash || parseFloat(initialCash) < 0}
          >
            {t('common.confirm') || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

