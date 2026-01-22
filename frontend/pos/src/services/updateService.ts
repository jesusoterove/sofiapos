/**
 * Update service for managing application updates.
 * Handles update checking, downloading, and installation via Electron API.
 */
export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
  files?: Array<{ url: string; sha512: string; size: number }>
}

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateCallbacks {
  onChecking?: () => void
  onAvailable?: (info: UpdateInfo) => void
  onNotAvailable?: () => void
  onError?: (error: string) => void
  onProgress?: (progress: UpdateProgress) => void
  onDownloaded?: (info: UpdateInfo) => void
}

class UpdateService {
  private callbacks: UpdateCallbacks = {}
  private cleanupFunctions: Array<() => void> = []

  /**
   * Check if running in Electron environment.
   */
  static isElectron(): boolean {
    return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
  }

  /**
   * Get current app version.
   */
  static async getAppVersion(): Promise<string | null> {
    if (!this.isElectron()) {
      return null
    }
    try {
      return await window.electronAPI.getAppVersion()
    } catch (error) {
      console.error('[UpdateService] Error getting app version:', error)
      return null
    }
  }

  /**
   * Check for available updates.
   */
  static async checkForUpdates(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron environment' }
    }

    try {
      const result = await window.electronAPI.checkForUpdates()
      return result
    } catch (error) {
      console.error('[UpdateService] Error checking for updates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates'
      }
    }
  }

  /**
   * Download available update.
   */
  static async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron environment' }
    }

    try {
      const result = await window.electronAPI.downloadUpdate()
      return result
    } catch (error) {
      console.error('[UpdateService] Error downloading update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download update'
      }
    }
  }

  /**
   * Install downloaded update and restart app.
   */
  static async installUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron environment' }
    }

    try {
      const result = await window.electronAPI.installUpdate()
      return result
    } catch (error) {
      console.error('[UpdateService] Error installing update:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to install update'
      }
    }
  }

  /**
   * Setup update event listeners.
   * Returns cleanup function to remove listeners.
   */
  setupListeners(callbacks: UpdateCallbacks): () => void {
    if (!UpdateService.isElectron()) {
      console.warn('[UpdateService] Cannot setup listeners - not in Electron environment')
      return () => {}
    }

    this.callbacks = callbacks

    // Setup all listeners
    const channels = [
      'update-checking',
      'update-available',
      'update-not-available',
      'update-error',
      'update-download-progress',
      'update-downloaded'
    ]

    // Remove existing listeners first
    channels.forEach(channel => {
      window.electronAPI.removeAllListeners(channel)
    })

    // Setup new listeners
    if (callbacks.onChecking) {
      window.electronAPI.onUpdateChecking(() => {
        callbacks.onChecking?.()
      })
    }

    if (callbacks.onAvailable) {
      window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        callbacks.onAvailable?.(info)
      })
    }

    if (callbacks.onNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        callbacks.onNotAvailable?.()
      })
    }

    if (callbacks.onError) {
      window.electronAPI.onUpdateError((error: { message: string; stack?: string }) => {
        callbacks.onError?.(error.message)
      })
    }

    if (callbacks.onProgress) {
      window.electronAPI.onUpdateDownloadProgress((progress: UpdateProgress) => {
        callbacks.onProgress?.(progress)
      })
    }

    if (callbacks.onDownloaded) {
      window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
        callbacks.onDownloaded?.(info)
      })
    }

    // Return cleanup function
    const cleanup = () => {
      channels.forEach(channel => {
        window.electronAPI.removeAllListeners(channel)
      })
      this.callbacks = {}
    }

    this.cleanupFunctions.push(cleanup)
    return cleanup
  }

  /**
   * Cleanup all listeners.
   */
  cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []
    this.callbacks = {}
  }
}

// Export singleton instance
export const updateService = new UpdateService()

// Export class for static methods
export { UpdateService }

