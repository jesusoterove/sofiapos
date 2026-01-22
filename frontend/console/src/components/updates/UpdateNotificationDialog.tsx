/**
 * Update notification dialog component.
 */
import { useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Modal, Button } from '@sofiapos/ui'
import { useQuery } from '@tanstack/react-query'
import { cashRegistersApi } from '@/api/cashRegisters'
import type { ApplicationVersion } from '@/api/updates'

interface UpdateNotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  version: ApplicationVersion
  onNotify: (notifyAll: boolean, cashRegisterIds?: number[]) => void
  isSubmitting: boolean
}

export function UpdateNotificationDialog({
  isOpen,
  onClose,
  version,
  onNotify,
  isSubmitting,
}: UpdateNotificationDialogProps) {
  const { t } = useTranslation()
  const [notifyAll, setNotifyAll] = useState(true)
  const [selectedCashRegisters, setSelectedCashRegisters] = useState<number[]>([])

  // Fetch cash registers
  const { data: cashRegisters = [] } = useQuery({
    queryKey: ['cash-registers'],
    queryFn: () => cashRegistersApi.list(),
  })

  const handleSubmit = () => {
    if (notifyAll) {
      onNotify(true)
    } else {
      onNotify(false, selectedCashRegisters)
    }
  }

  const toggleCashRegister = (id: number) => {
    setSelectedCashRegisters((prev) =>
      prev.includes(id) ? prev.filter((crId) => crId !== id) : [...prev, id]
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('updates.notifyClients') || 'Notify Clients About Update'}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {t('updates.notifyDescription') || 'Send update notification to POS clients:'}
          </p>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.version') || 'Version'}: {version.version}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('updates.platform') || 'Platform'}: {version.platform}
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="radio"
              checked={notifyAll}
              onChange={() => {
                setNotifyAll(true)
                setSelectedCashRegisters([])
              }}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.notifyAll') || 'Notify all connected clients'}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!notifyAll}
              onChange={() => setNotifyAll(false)}
              className="w-4 h-4"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {t('updates.notifySpecific') || 'Notify specific cash registers'}
            </span>
          </label>
        </div>

        {!notifyAll && (
          <div className="max-h-60 overflow-y-auto border rounded-lg p-3" style={{ borderColor: 'var(--color-border-default)' }}>
            {cashRegisters.length === 0 ? (
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                {t('updates.noCashRegisters') || 'No cash registers found'}
              </p>
            ) : (
              <div className="space-y-2">
                {cashRegisters.map((cr: { id: number; name: string; code: string }) => (
                  <label
                    key={cr.id}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCashRegisters.includes(cr.id)}
                      onChange={() => toggleCashRegister(cr.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {cr.name || cr.code} ({cr.code})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (!notifyAll && selectedCashRegisters.length === 0)}
          >
            {isSubmitting
              ? t('common.loading') || 'Loading...'
              : t('updates.sendNotification') || 'Send Notification'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

