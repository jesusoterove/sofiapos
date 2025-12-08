/**
 * First synchronization modal component.
 * Shows sync progress or error for the first sync only.
 */
import { Modal, Button, Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useSync } from '@/contexts/SyncContext'

interface FirstSyncModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function FirstSyncModal({ isOpen, onClose }: FirstSyncModalProps) {
  const { t } = useTranslation()
  const { isSyncing, syncProgress, syncError, retrySync } = useSync()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sync.firstSync') || 'First Synchronization'}
      size="md"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      showCloseButton={!isSyncing && syncError}
    >
      <div className="space-y-4">
        {isSyncing ? (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="mt-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
                {syncProgress?.message || (t('sync.syncing') || 'Synchronizing data...')}
              </p>
              {syncProgress && (
                <div className="w-full mt-4 space-y-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${syncProgress.progress}%`,
                        backgroundColor: 'var(--color-primary-600)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {syncProgress.progress}%
                  </p>
                </div>
              )}
            </div>
          </>
        ) : syncError ? (
          <>
            <div className="py-4">
              <p className="text-sm text-red-600 mb-4">{syncError}</p>
              <div className="flex gap-2 justify-end">
                {onClose && (
                  <Button variant="secondary" onClick={onClose}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                )}
                <Button variant="primary" onClick={retrySync}>
                  {t('sync.retry') || 'Retry'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('sync.starting') || 'Starting synchronization...'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

