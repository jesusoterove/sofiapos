/**
 * Sync screen component that blocks the UI until initial sync is complete.
 */
import React from 'react'
import { useSync } from '@/contexts/SyncContext'
import { useTranslation } from '@/i18n/hooks'
import { Spinner } from '@sofiapos/ui'

export function SyncScreen({ children }: { children: React.ReactNode }) {
  const { isSyncing, syncProgress, isSyncComplete, syncError, retrySync } = useSync()
  const { t } = useTranslation()

  // If sync is complete and not syncing, show children
  if (isSyncComplete && !isSyncing) {
    return <>{children}</>
  }

  // If sync failed but we're not actively syncing, show error but allow access
  // User can dismiss or retry
  const showErrorOnly = syncError && !isSyncing && !isSyncComplete

  // If showing error only (not blocking), render as overlay
  if (showErrorOnly) {
    return (
      <>
        {children}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Allow clicking outside to dismiss (optional - can remove if you want to force retry)
            if (e.target === e.currentTarget) {
              // Could add dismiss functionality here if needed
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('sync.syncError') || 'Sync Error'}
            </h3>
            <p className="text-sm mb-4 text-red-600">{syncError}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={retrySync}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600, #2563EB)',
                  color: 'var(--color-text-on-primary, #FFFFFF)',
                }}
              >
                {t('sync.retry') || 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Show full-screen sync screen (blocking)
  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen"
      style={{
        backgroundColor: 'var(--color-bg-default, #F9FAFB)',
      }}
    >
      <div className="text-center space-y-4 p-8">
        {isSyncing && <Spinner size="large" />}
        <div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {isSyncing ? (t('sync.syncing') || 'Synchronizing Data...') : (t('sync.syncError') || 'Sync Error')}
          </h2>
          {syncProgress && (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {syncProgress.message}
              </p>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${syncProgress.progress}%`,
                    backgroundColor: 'var(--color-primary-600, #2563EB)',
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {syncProgress.progress}%
              </p>
            </div>
          )}
          {syncError && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-600">{syncError}</p>
              <button
                onClick={retrySync}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600, #2563EB)',
                  color: 'var(--color-text-on-primary, #FFFFFF)',
                }}
              >
                {t('sync.retry') || 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

