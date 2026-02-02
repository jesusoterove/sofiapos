/**
 * Update notification component.
 * Displays update availability and handles download/install.
 */
import { useState } from 'react'
import { Modal, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useUpdate } from '@/contexts/UpdateContext'
import { UpdateService, type UpdateProgress } from '@/services/updateService'
import { FaDownload, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'

interface UpdateNotificationProps {
  isOpen: boolean
  onClose: () => void
  updateInfo: { version: string; releaseNotes?: string; files?: Array<{ url: string; sha512: string; size: number }> } | null
  isMandatory?: boolean
}

export function UpdateNotification({
  isOpen,
  onClose,
  updateInfo,
  isMandatory = false,
}: UpdateNotificationProps) {
  const { t } = useTranslation()
  const { status, downloadProgress, error, downloadUpdate, installUpdate } = useUpdate()
  const [isInstalling, setIsInstalling] = useState(false)

  const handleDownload = async () => {
    if (!updateInfo) return
    await downloadUpdate()
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await installUpdate()
      // If successful, app will restart automatically
    } catch (error) {
      setIsInstalling(false)
      // Error is handled by UpdateContext
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatProgress = (progress: UpdateProgress): string => {
    return `${progress.percent.toFixed(1)}% (${formatFileSize(progress.transferred)} / ${formatFileSize(progress.total)})`
  }

  if (!updateInfo) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isMandatory ? () => {} : (onClose ?? (() => {}))}
      title={t('update.available') || 'Update Available'}
      size="md"
      showCloseButton={!isMandatory}
    >
      <div className="space-y-4">
        {/* Update Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('update.version') || 'Version'} {updateInfo.version}
            </h3>
            {isMandatory && (
              <span
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: 'var(--color-error-100, #FEE2E2)',
                  color: 'var(--color-error-800, #991B1B)',
                }}
              >
                {t('update.mandatory') || 'Mandatory'}
              </span>
            )}
          </div>

          {updateInfo.releaseNotes && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary, #F9FAFB)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <p className="font-medium mb-1">{t('update.releaseNotes') || 'Release Notes'}:</p>
              <p className="whitespace-pre-wrap">{updateInfo.releaseNotes}</p>
            </div>
          )}

          {updateInfo.files && updateInfo.files[0] && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('update.fileSize') || 'File size'}: {formatFileSize(updateInfo.files[0].size)}
            </p>
          )}
        </div>

        {/* Download Progress */}
        {status === 'downloading' && downloadProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {t('update.downloading') || 'Downloading'}...
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {formatProgress(downloadProgress)}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${downloadProgress.percent}%`,
                  backgroundColor: 'var(--color-primary-600, #2563EB)',
                }}
              />
            </div>
            {downloadProgress.bytesPerSecond > 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {t('update.downloadSpeed') || 'Speed'}: {formatFileSize(downloadProgress.bytesPerSecond)}/s
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && error && (
          <div
            className="p-3 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-error-50, #FEF2F2)',
              border: '1px solid var(--color-error-200, #FECACA)',
            }}
          >
            <FaExclamationTriangle style={{ color: 'var(--color-error-600, #DC2626)' }} />
            <p className="text-sm" style={{ color: 'var(--color-error-800, #991B1B)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {status === 'downloaded' && (
          <div
            className="p-3 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-success-50, #F0FDF4)',
              border: '1px solid var(--color-success-200, #BBF7D0)',
            }}
          >
            <FaCheckCircle style={{ color: 'var(--color-success-600, #16A34A)' }} />
            <p className="text-sm" style={{ color: 'var(--color-success-800, #166534)' }}>
              {t('update.downloaded') || 'Update downloaded successfully. Ready to install.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          {status === 'available' && (
            <>
              {!isMandatory && (
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  {t('common.later') || 'Later'}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleDownload}
                className="flex-1"
                disabled={!UpdateService.isElectron()}
              >
                <FaDownload className="mr-2" />
                {t('update.download') || 'Download'}
              </Button>
            </>
          )}

          {status === 'downloading' && (
            <div className="flex items-center justify-center gap-2 flex-1" style={{ color: 'var(--color-text-secondary)' }}>
              <FaSpinner className="animate-spin" />
              <span>{t('update.downloading') || 'Downloading'}...</span>
            </div>
          )}

          {status === 'downloaded' && (
            <>
              <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isInstalling}>
                {t('common.later') || 'Install Later'}
              </Button>
              <Button
                variant="primary"
                onClick={handleInstall}
                className="flex-1"
                disabled={isInstalling || !UpdateService.isElectron()}
              >
                {isInstalling ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {t('update.installing') || 'Installing'}...
                  </>
                ) : (
                  t('update.installNow') || 'Install Now'
                )}
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {t('common.close') || 'Close'}
              </Button>
              <Button variant="primary" onClick={handleDownload} className="flex-1">
                {t('update.retry') || 'Retry'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

