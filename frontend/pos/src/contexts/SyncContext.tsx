/**
 * Sync context for managing initial sync status.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  retrySync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

interface SyncProviderProps {
  children: ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isSyncComplete, setIsSyncComplete] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showCredentialDialog, setShowCredentialDialog] = useState(false)

  const performSync = async () => {
    if (!isAuthenticated) {
      return
    }

    // Verify auth token is available before syncing
    const token = localStorage.getItem('auth_token') || localStorage.getItem('pos_auth_token')
    if (!token) {
      setSyncError('Authentication token not found. Please log in again.')
      setIsSyncComplete(false)
      return
    }

    // Check if sync already completed
    const alreadySynced = await hasCompletedInitialSync()
    if (alreadySynced) {
      setIsSyncComplete(true)
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      const result = await performInitialSync((progress) => {
        setSyncProgress(progress)
      })

      if (result.success) {
        setIsSyncComplete(true)
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
            })
            if (retryResult.success) {
              setIsSyncComplete(true)
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
            })
            if (retryResult.success) {
              setIsSyncComplete(true)
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

  useEffect(() => {
    if (isAuthenticated) {
      performSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const retrySync = async () => {
    setIsSyncComplete(false)
    setShowCredentialDialog(false)
    await performSync()
  }

  const handleCredentialSuccess = async () => {
    setShowCredentialDialog(false)
    setSyncError(null)
    // Retry sync after successful re-authentication
    await retrySync()
  }

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        syncProgress,
        isSyncComplete,
        syncError,
        retrySync,
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
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

