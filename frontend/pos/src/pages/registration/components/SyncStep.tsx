/**
 * Synchronization step component for registration wizard.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Button, Spinner } from '@sofiapos/ui'
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSync } from 'react-icons/fa'
import { performInitialSync, SyncProgress, hasCompletedInitialSync } from '@/services/initialSync'
import { getRegistrationProgress } from '@/utils/registration'
import apiClient from '@/api/client'

interface SyncStepProps {
  onNext: () => void
  onBack: () => void
  adminToken: string
  storeId?: number | null
}

export function SyncStep({ onNext, onBack, adminToken, storeId: propStoreId }: SyncStepProps) {
  const { t } = useTranslation()
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncComplete, setSyncComplete] = useState(false)
  const [wasAlreadySynced, setWasAlreadySynced] = useState(false)

  useEffect(() => {
    // Set admin token for API calls during sync
    if (adminToken) {
      localStorage.setItem('pos_auth_token', adminToken)
      // Set flag to indicate we're using admin token (skip token refresh)
      localStorage.setItem('pos_using_admin_token', 'true')
      // Also set in apiClient if needed
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
    }

    // Check if already synced
    checkIfAlreadySynced()

    return () => {
      // Clean up flag on unmount (security)
      // Note: Token cleanup happens after successful sync in startSync
      // This cleanup is a safety net in case component unmounts before sync completes
      localStorage.removeItem('pos_using_admin_token')
    }
  }, [adminToken])

  const checkIfAlreadySynced = async () => {
    const alreadySynced = await hasCompletedInitialSync()
    if (alreadySynced) {
      setWasAlreadySynced(true)
      setSyncComplete(true)
    } else {
      // Start sync automatically if not already synced
      startSync()
    }
  }

  const startSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    setSyncComplete(false)

    // Get storeId from prop first, then fallback to registration progress
    const progress = getRegistrationProgress()
    // Use nullish coalescing to handle null properly, but preserve 0 as valid storeId
    const storeId = propStoreId ?? progress?.selectedStoreId ?? undefined

    if (!storeId) {
      console.warn('[SyncStep] No storeId found, inventory config sync will be skipped')
    } else {
      console.log(`[SyncStep] Starting sync with storeId: ${storeId}`)
    }

    try {
      const result = await performInitialSync((progress) => {
        setSyncProgress(progress)
      }, storeId)

      if (result.success) {
        setSyncComplete(true)
        // Clear admin token and flag after successful sync (security)
        localStorage.removeItem('pos_auth_token')
        localStorage.removeItem('pos_using_admin_token')
        delete apiClient.defaults.headers.common['Authorization']
      } else {
        setSyncError(result.error || 'Sync failed')
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error'
      setSyncError(errorMessage)
      // Clear admin token flag on error (but keep token in case user wants to retry)
      // The token will be cleared when sync succeeds or component unmounts
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRetry = () => {
    startSync()
  }

  const handleSyncAgain = () => {
    setWasAlreadySynced(false)
    setSyncComplete(false)
    startSync()
  }

  const handleNext = () => {
    if (syncComplete) {
      onNext()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="text-white opacity-90 hover:opacity-100 transition-opacity"
                disabled={isSyncing}
              >
                <FaArrowLeft />
              </button>
              <span className="text-sm text-white opacity-90">
                {t('registration.step') || 'Step'} 4/6
              </span>
            </div>
            <h2 className="text-2xl font-bold">
              {t('registration.syncStep.title') || 'Synchronizing Data'}
            </h2>
            <p className="text-white opacity-90 mt-2">
              {t('registration.syncStep.description') || 'Downloading products, materials, and settings from server...'}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            {isSyncing && !syncComplete && (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-[var(--color-primary-500)] h-4 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress?.progress || 0}%` }}
                  />
                </div>

                {/* Progress Message */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Spinner size="sm" className="mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {syncProgress?.message || t('registration.syncStep.progress') || 'Synchronizing...'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {syncProgress?.step === 'products' && (t('registration.syncStep.syncingProducts') || 'Syncing products...')}
                    {syncProgress?.step === 'materials' && (t('registration.syncStep.syncingMaterials') || 'Syncing materials...')}
                    {syncProgress?.step === 'settings' && (t('registration.syncStep.syncingSettings') || 'Syncing settings...')}
                    {syncProgress?.step === 'complete' && (t('registration.syncStep.complete') || 'Complete!')}
                  </p>
                </div>
              </div>
            )}

            {syncComplete && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <FaCheckCircle className="text-6xl text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {t('registration.syncStep.complete') || 'Synchronization Complete!'}
                  </h3>
                  {wasAlreadySynced && (
                    <p className="text-sm text-gray-600 mb-3">
                      {t('registration.syncStep.alreadySynced') || 'Data was already synchronized. You can sync again to get the latest updates.'}
                    </p>
                  )}
                  {syncProgress && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {syncProgress.productsCount && (
                        <p>{syncProgress.productsCount} {t('registration.syncStep.productsSynced') || 'products synced'}</p>
                      )}
                      {syncProgress.materialsCount && (
                        <p>{syncProgress.materialsCount} {t('registration.syncStep.materialsSynced') || 'materials synced'}</p>
                      )}
                      {syncProgress.settingsCount && (
                        <p>{syncProgress.settingsCount} {t('registration.syncStep.settingsSynced') || 'settings synced'}</p>
                      )}
                    </div>
                  )}
                </div>
                {wasAlreadySynced && (
                  <Button
                    variant="secondary"
                    onClick={handleSyncAgain}
                    className="w-full"
                  >
                    <FaSync className="mr-2 inline" />
                    {t('registration.syncStep.syncAgain') || 'Sync Again'}
                  </Button>
                )}
              </div>
            )}

            {syncError && !isSyncing && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    <h3 className="font-semibold text-red-800">
                      {t('registration.syncStep.error') || 'Synchronization Failed'}
                    </h3>
                  </div>
                  <p className="text-sm text-red-700">{syncError}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleRetry}
                  className="w-full"
                >
                  <FaSync className="mr-2 inline" />
                  {t('registration.syncStep.retry') || 'Retry'}
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                className="flex-1"
                disabled={isSyncing}
              >
                <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
              </Button>
              {syncComplete && (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                >
                  {t('common.next') || 'Next'} <FaCheckCircle className="ml-2 inline" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

