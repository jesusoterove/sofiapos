/**
 * Update context for managing application updates.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { updateService, UpdateService, type UpdateInfo, type UpdateStatus } from '@/services/updateService'

interface UpdateContextType {
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: { percent: number; transferred: number; total: number; bytesPerSecond: number } | null
  error: string | null
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  clearError: () => void
  isElectron: boolean
  currentVersion: string | null
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined)

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; transferred: number; total: number; bytesPerSecond: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const isElectron = UpdateService.isElectron()

  // Get current version on mount
  useEffect(() => {
    if (isElectron) {
      UpdateService.getAppVersion().then(version => {
        setCurrentVersion(version)
      })
    }
  }, [isElectron])

  // Setup update event listeners
  useEffect(() => {
    if (!isElectron) {
      return
    }

    const cleanup = updateService.setupListeners({
      onChecking: () => {
        setStatus('checking')
        setError(null)
      },
      onAvailable: (info) => {
        setStatus('available')
        setUpdateInfo(info)
        setError(null)
      },
      onNotAvailable: () => {
        setStatus('not-available')
        setUpdateInfo(null)
        setError(null)
      },
      onError: (errorMessage) => {
        setStatus('error')
        setError(errorMessage)
      },
      onProgress: (progress) => {
        setStatus('downloading')
        setDownloadProgress(progress)
      },
      onDownloaded: (info) => {
        setStatus('downloaded')
        setUpdateInfo(info)
        setDownloadProgress(null)
      },
    })

    return cleanup
  }, [isElectron])

  const checkForUpdates = useCallback(async () => {
    if (!isElectron) {
      return
    }

    setStatus('checking')
    setError(null)
    const result = await UpdateService.checkForUpdates()
    if (!result.success) {
      setError(result.error || 'Failed to check for updates')
      setStatus('error')
    }
  }, [isElectron])

  const downloadUpdate = useCallback(async () => {
    if (!isElectron || !updateInfo) {
      return
    }

    setStatus('downloading')
    setError(null)
    const result = await UpdateService.downloadUpdate()
    if (!result.success) {
      setError(result.error || 'Failed to download update')
      setStatus('error')
    }
  }, [isElectron, updateInfo])

  const installUpdate = useCallback(async () => {
    if (!isElectron) {
      return
    }

    const result = await UpdateService.installUpdate()
    if (!result.success) {
      setError(result.error || 'Failed to install update')
      setStatus('error')
    }
    // If successful, app will restart automatically
  }, [isElectron])

  const clearError = useCallback(() => {
    setError(null)
    if (status === 'error') {
      setStatus('idle')
    }
  }, [status])

  return (
    <UpdateContext.Provider
      value={{
        status,
        updateInfo,
        downloadProgress,
        error,
        checkForUpdates,
        downloadUpdate,
        installUpdate,
        clearError,
        isElectron,
        currentVersion,
      }}
    >
      {children}
    </UpdateContext.Provider>
  )
}

export function useUpdate() {
  const context = useContext(UpdateContext)
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider')
  }
  return context
}

