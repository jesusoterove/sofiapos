/**
 * Sync results modal component for viewing background sync results.
 */
import { Modal, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useSync } from '@/contexts/SyncContext'
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa'

interface SyncResultsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SyncResultsModal({ isOpen, onClose }: SyncResultsModalProps) {
  const { t } = useTranslation()
  const { isSyncing, syncProgress, syncError, isSyncComplete, retrySync } = useSync()

  const getStatusIcon = () => {
    if (isSyncing) {
      return <FaClock className="text-blue-500" />
    }
    if (syncError) {
      return <FaTimesCircle className="text-red-500" />
    }
    if (isSyncComplete) {
      return <FaCheckCircle className="text-green-500" />
    }
    return null
  }

  const getStatusText = () => {
    if (isSyncing) {
      return t('sync.inProgress') || 'Synchronization in progress'
    }
    if (syncError) {
      return t('sync.failed') || 'Synchronization failed'
    }
    if (isSyncComplete) {
      return t('sync.complete') || 'Synchronization complete'
    }
    return t('sync.notStarted') || 'Synchronization not started'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sync.results') || 'Synchronization Results'}
      size="md"
    >
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
          <div className="text-2xl">{getStatusIcon()}</div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {getStatusText()}
            </p>
            {syncProgress && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {syncProgress.message}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {syncProgress && (
          <div className="space-y-2">
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

        {/* Error Message */}
        {syncError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{syncError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          {syncError && (
            <Button variant="primary" onClick={retrySync}>
              {t('sync.retry') || 'Retry'}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t('common.close') || 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

