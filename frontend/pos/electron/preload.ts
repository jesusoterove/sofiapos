/**
 * Electron preload script.
 * Provides secure bridge between renderer and main process.
 */
import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Update event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback)
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_, info) => callback(info))
  },
  onUpdateError: (callback: (error: { message: string; stack?: string }) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
  },
  onUpdateDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => {
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
  
  // Platform info
  platform: process.platform,
  
  // Window controls (if needed)
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
})

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>
      getAppPath: () => Promise<string>
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
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
  
  interface UpdateInfo {
    version: string
    releaseDate?: string
    releaseNotes?: string
    files?: Array<{ url: string; sha512: string; size: number }>
  }
  
  interface UpdateProgress {
    percent: number
    transferred: number
    total: number
    bytesPerSecond: number
  }
}

