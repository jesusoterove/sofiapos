/**
 * Sync context for managing initial sync status.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { performInitialSync, hasCompletedInitialSync, SyncProgress } from '../services/initialSync'
import { checkAndSyncUpdates, syncEntityType } from '../services/incrementalSync'
import { useAuth } from './AuthContext'
import { refreshToken } from '../services/tokenRefresh'
import { CredentialDialog } from '../components/sync/CredentialDialog'
import { useTranslation } from '../i18n/hooks'
import { getRegistration } from '../utils/registration'
import { initWebSocketClient, disconnectWebSocketClient, getWebSocketClient, type WebSocketStatus } from '../services/websocketClient'

interface SyncContextType {
  isSyncing: boolean
  syncProgress: SyncProgress | null
  isSyncComplete: boolean
  syncError: string | null
  isFirstSync: boolean
  syncAuthFailure: boolean // Track if sync failed due to authentication
  incrementalSyncError: string | null // Track incremental sync errors (silent)
  websocketStatus: WebSocketStatus // WebSocket connection status
  retrySync: () => Promise<void>
  startBackgroundSync: () => Promise<void>
  performIncrementalSync: () => Promise<void> // Perform incremental sync silently
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
  const [incrementalSyncError, setIncrementalSyncError] = useState<string | null>(null) // Track incremental sync errors (silent)
  const [websocketStatus, setWebsocketStatus] = useState<WebSocketStatus>('disconnected')

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

    // Get storeId from user, registration, or registration progress
    // During initial sync (especially during registration), user might not be loaded yet
    const registration = getRegistration()
    const storeId = user?.store_id || registration?.storeId || null

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

  /**
   * Perform incremental sync silently in the background.
   * This function never shows toast notifications and only updates sync state.
   * Errors are logged and tracked in incrementalSyncError for bottom bar indicator.
   */
  const performIncrementalSync = async () => {
    // Only perform incremental sync if initial sync is complete
    if (!isSyncComplete || isSyncing) {
      return
    }

    // Don't perform incremental sync if not authenticated
    if (!isAuthenticated) {
      return
    }

    try {
      // Get storeId from user or registration
      const registration = getRegistration()
      const storeId = user?.store_id || registration?.storeId || undefined

      // Perform incremental sync silently
      const results = await checkAndSyncUpdates(storeId, (result) => {
        if (!result.success && result.error) {
          console.error(`[performIncrementalSync] Error syncing ${result.entityType}:`, result.error)
          setIncrementalSyncError(result.error)
        } else {
          // Clear error if sync succeeds
          if (incrementalSyncError) {
            setIncrementalSyncError(null)
          }
        }
      })

      // Check if any syncs failed
      const hasErrors = results.some((r) => !r.success)
      if (hasErrors) {
        const errorMessages = results.filter((r) => !r.success).map((r) => r.error).join(', ')
        setIncrementalSyncError(errorMessages || 'Incremental sync failed')
      } else {
        // Clear error if all syncs succeeded
        setIncrementalSyncError(null)
      }
    } catch (error: any) {
      // Log error but don't throw - this is a background operation
      console.error('[performIncrementalSync] Error during incremental sync:', error)
      setIncrementalSyncError(error?.message || 'Incremental sync failed')
    }
  }

  // Check sync status on mount and when authentication changes
  useEffect(() => {
    const checkSyncStatus = async () => {
      // Only check if we're not already syncing and not already marked as complete
      if (isSyncing || isSyncComplete) {
        return
      }

      try {
        const alreadySynced = await hasCompletedInitialSync()
        if (alreadySynced) {
          console.log('[SyncContext] Initial sync already completed, setting isSyncComplete to true')
          setIsSyncComplete(true)
          setIsFirstSync(false)
        } else {
          console.log('[SyncContext] Initial sync not completed yet')
          // Don't automatically trigger sync - let POSScreen or other components handle it
          setIsSyncComplete(false)
        }
      } catch (error) {
        console.error('[SyncContext] Error checking sync status:', error)
        // On error, assume sync is not complete
        setIsSyncComplete(false)
      }
    }

    // Only check if authenticated (or if we want to check regardless)
    // We check even if not authenticated to handle the case where sync was completed before logout
    checkSyncStatus()
  }, [isAuthenticated]) // Check when authentication state changes

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

  // Initialize WebSocket client on mount and when sync is complete
  useEffect(() => {
    console.log("[SyncContext] Initializing WebSocket client...", isSyncComplete, isAuthenticated)
    // Only connect if initial sync is complete and user is authenticated
    if (!isSyncComplete || !isAuthenticated) {
      return
    }

    // Initialize WebSocket client with callbacks
    initWebSocketClient({
      onStatusChange: (status) => {
        setWebsocketStatus(status)
      },
      onEntityUpdate: async (entityType, entityId, changeType) => {
        // Trigger incremental sync for the updated entity type only
        console.log(`[SyncContext] 🔔 WebSocket notification received: ${entityType} #${entityId} (${changeType})`)
        console.log(`[SyncContext] Triggering incremental sync for ${entityType} only...`)
        
        // Perform incremental sync silently for the specific entity type
        try {
          const registration = getRegistration()
          const storeId = user?.store_id || registration?.storeId || undefined
          
          console.log(`[SyncContext] Starting incremental sync for entity: ${entityType}, storeId: ${storeId}`)
          
          // Sync only the specific entity type that was updated (optimized)
          const result = await syncEntityType(entityType, storeId)
          
          if (!result.success && result.error) {
            console.error(`[SyncContext] Error syncing ${entityType}:`, result.error)
            setIncrementalSyncError(result.error)
          } else {
            // Clear error if sync succeeds
            if (incrementalSyncError) {
              setIncrementalSyncError(null)
            }
            console.log(`[SyncContext] ✅ Incremental sync completed for ${entityType} #${entityId}: ${result.recordsUpdated} records updated`)
          }
        } catch (error) {
          console.error('[SyncContext] ❌ Error syncing after WebSocket notification:', error)
          setIncrementalSyncError(error instanceof Error ? error.message : 'Sync failed')
        }
      },
      onError: (error) => {
        console.error('[SyncContext] WebSocket error:', error)
        // Don't set sync error - WebSocket errors are silent
      },
    })

    // Cleanup on unmount
    return () => {
      disconnectWebSocketClient()
    }
    // Note: performIncrementalSync is intentionally not in deps - it's only used in callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncComplete, isAuthenticated, user?.store_id])

  // Enhanced online event handler: Reconnect WebSocket and perform incremental sync
  useEffect(() => {
    const handleOnline = async () => {
      if (!isSyncComplete || !isAuthenticated) {
        return
      }

      console.log('[SyncContext] Connection restored, checking for updates...')

      // Reconnect WebSocket
      const client = getWebSocketClient()
      if (client.getStatus() === 'disconnected') {
        client.connect()
      }

      // Perform incremental sync silently in background
      // This checks for updates and syncs only changed records
      try {
        // Clear any previous incremental sync errors
        setIncrementalSyncError(null)

        // Perform incremental sync silently
        await performIncrementalSync()

        console.log('[SyncContext] Incremental sync completed after reconnection')
      } catch (error: any) {
        // Log error but don't show toast - update bottom bar indicator only
        console.error('[SyncContext] Error during reconnection sync:', error)
        setIncrementalSyncError(error?.message || 'Sync failed after reconnection')
      }
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [isSyncComplete, isAuthenticated, performIncrementalSync])

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncProgress,
        isSyncComplete,
        syncError,
        isFirstSync,
        syncAuthFailure,
        incrementalSyncError,
        websocketStatus,
        retrySync,
        startBackgroundSync,
        performIncrementalSync,
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
        incrementalSyncError: null,
        websocketStatus: 'disconnected',
        retrySync: async () => {},
        startBackgroundSync: async () => {},
        performIncrementalSync: async () => {},
        clearSyncAuthFailure: () => {},
      }
  }
  return context
}

