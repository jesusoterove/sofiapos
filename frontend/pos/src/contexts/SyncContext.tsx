/**
 * Sync context for managing initial sync status.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { performInitialSync, hasCompletedInitialSync, SyncProgress } from '../services/initialSync'
import { useAuth } from './AuthContext'
import { refreshToken } from '../services/tokenRefresh'
import { CredentialDialog } from '../components/sync/CredentialDialog'
import { useTranslation } from '../i18n/hooks'

interface SyncContextType {
  isSyncing: boolean
  syncProgress: SyncProgress | null
  isSyncComplete: boolean
  syncError: string | null
  isFirstSync: boolean
  syncAuthFailure: boolean // Track if sync failed due to authentication
  retrySync: () => Promise<void>
  startBackgroundSync: () => Promise<void>
  clearSyncAuthFailure: () => void // Clear the auth failure flag
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated, user } = useAuth()
  const { t } = useTranslation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isSyncComplete, setIsSyncComplete] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isFirstSync, setIsFirstSync] = useState(false)
  const [isBackgroundMode, setIsBackgroundMode] = useState(false)
  const [showCredentialDialog, setShowCredentialDialog] = useState(false)
  const [syncAuthFailure, setSyncAuthFailure] = useState(false) // Track sync auth failures

  const performSync = async (backgroundMode: boolean = false) => {
    if (!isAuthenticated) {
      return
    }

    // Verify auth token is available before syncing
    const token = localStorage.getItem('auth_token') || localStorage.getItem('pos_auth_token')
    if (!token) {
      setSyncError('Authentication token not found. Please log in again.')
      setIsSyncComplete(false)
      setIsSyncing(false) // Make sure we're not in syncing state
      return
    }

    // Check if sync already completed
    const alreadySynced = await hasCompletedInitialSync()
    if (alreadySynced) {
      setIsSyncComplete(true)
      setIsSyncing(false)
      setIsFirstSync(false)
      return
    }

    setIsSyncing(true)
    setIsBackgroundMode(backgroundMode)
    setSyncError(null)
    
    // Determine if this is first sync
    if (!backgroundMode) {
      setIsFirstSync(true)
    }

    // Get storeId from user or registration progress
    const storeId = user?.store_id || null

    try {
      const result = await performInitialSync((progress) => {
        setSyncProgress(progress)
      }, storeId || undefined)

      if (result.success) {
        setIsSyncComplete(true)
        setIsFirstSync(false)
        setSyncProgress({
          step: 'complete',
          progress: 100,
          message: 'Sync complete!',
        })
      } else {
        // Check if error is due to authentication failure
        const errorMsg = result.error || 'Sync failed'
        if (errorMsg.includes('Authentication') || errorMsg.includes('401')) {
          // Try to refresh token first
          const newToken = await refreshToken()
          if (newToken) {
            // Retry sync with new token
            const retryResult = await performInitialSync((progress) => {
              setSyncProgress(progress)
            }, storeId || undefined)
            if (retryResult.success) {
              setIsSyncComplete(true)
              setIsFirstSync(false)
              setSyncProgress({
                step: 'complete',
                progress: 100,
                message: 'Sync complete!',
              })
              return
            }
          }
          // If refresh failed, show credential dialog
          setShowCredentialDialog(true)
          setSyncError('Authentication failed. Please re-enter your credentials.')
        } else {
          setSyncError(errorMsg)
        }
        setIsSyncComplete(false)
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if it's an authentication error
      if (error?.response?.status === 401 || errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        // Try to refresh token first
        const newToken = await refreshToken()
        if (newToken) {
          // Retry sync with new token
          try {
            const retryResult = await performInitialSync((progress) => {
              setSyncProgress(progress)
            }, storeId || undefined)
            if (retryResult.success) {
              setIsSyncComplete(true)
              setIsFirstSync(false)
              setSyncProgress({
                step: 'complete',
                progress: 100,
                message: 'Sync complete!',
              })
              return
            }
          } catch (retryError) {
            // Refresh token didn't help, show credential dialog
            setShowCredentialDialog(true)
            setSyncError('Authentication failed. Please re-enter your credentials.')
          }
        } else {
          // Refresh token failed, show credential dialog
          setShowCredentialDialog(true)
          setSyncError('Authentication failed. Please re-enter your credentials.')
        }
      } else {
        setSyncError(errorMessage)
      }
      setIsSyncComplete(false)
    } finally {
      setIsSyncing(false)
    }
  }

  // Don't auto-start sync - let POSScreen handle first sync flow
  // Background syncs will be triggered manually

  const retrySync = async () => {
    setIsSyncComplete(false)
    setShowCredentialDialog(false)
    await performSync(isBackgroundMode)
  }

  const startBackgroundSync = async () => {
    // Only start if sync is not already complete
    if (!isSyncComplete && !isSyncing) {
      await performSync(true)
    }
  }

  const handleCredentialSuccess = async () => {
    setShowCredentialDialog(false)
    setSyncError(null)
    setSyncAuthFailure(false) // Clear auth failure flag
    // Retry sync after successful re-authentication
    await retrySync()
  }

  const clearSyncAuthFailure = () => {
    setSyncAuthFailure(false)
  }

  // Listen for sync auth failure events from API client
  useEffect(() => {
    const handleSyncAuthFailure = () => {
      // Only set auth failure for background syncs (not first sync)
      if (isBackgroundMode || !isFirstSync) {
        setSyncAuthFailure(true)
        setSyncError('Authentication failed during synchronization. Please re-enter your credentials.')
      }
    }

    window.addEventListener('sync:auth-failure', handleSyncAuthFailure)
    return () => {
      window.removeEventListener('sync:auth-failure', handleSyncAuthFailure)
    }
  }, [isBackgroundMode, isFirstSync])

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncProgress,
        isSyncComplete,
        syncError,
        isFirstSync,
        syncAuthFailure,
        retrySync,
        startBackgroundSync,
        clearSyncAuthFailure,
      }}
    >
      {children}
      <CredentialDialog
        isOpen={showCredentialDialog}
        onClose={() => setShowCredentialDialog(false)}
        onSuccess={handleCredentialSuccess}
        message={t('sync.reauthMessage') || 'Your session has expired. Please enter your credentials to continue synchronization.'}
      />
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (context === undefined) {
    // Return default values instead of throwing error
    // This allows components to work even if SyncProvider is not available (e.g., during registration)
    console.warn('useSync called outside SyncProvider, using default values')
      return {
        isSyncing: false,
        syncProgress: null,
        isSyncComplete: false,
        syncError: null,
        isFirstSync: false,
        syncAuthFailure: false,
        retrySync: async () => {},
        startBackgroundSync: async () => {},
        clearSyncAuthFailure: () => {},
      }
  }
  return context
}

