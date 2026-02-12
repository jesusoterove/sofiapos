/**
 * Type declarations for Electron preload API (window.electronAPI).
 * The preload script exposes these on window via contextBridge.
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

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>
      getAppPath: () => Promise<string>
      getMachineId?: () => Promise<string>
      checkForUpdates: () => Promise<{ success: boolean; error?: string }>
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>
      installUpdate: () => Promise<{ success: boolean; error?: string }>
      onUpdateChecking: (callback: () => void) => void
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
      onUpdateNotAvailable: (callback: (info: { version: string }) => void) => void
      onUpdateError: (callback: (error: { message: string; stack?: string }) => void) => void
      onUpdateDownloadProgress: (callback: (progress: UpdateProgress) => void) => void
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
      removeAllListeners: (channel: string) => void
      platform: string
      serial?: {
        listPorts: () => Promise<Array<{ path: string; manufacturer?: string; vendorId?: string; productId?: string; serialNumber?: string }>>
        write: (portPath: string, baudRate: number, data: Uint8Array) => Promise<void>
      }
      printers?: {
        list: () => Promise<Array<{ name: string; displayName: string; description: string; status: number }>>
        sendRaw: (printerName: string, data: Uint8Array) => Promise<void>
      }
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}

export {}
