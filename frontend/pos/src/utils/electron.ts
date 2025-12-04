/**
 * Electron utilities for renderer process.
 */
export const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

/**
 * Get Electron API if available.
 */
export function getElectronAPI() {
  if (isElectron && window.electronAPI) {
    return window.electronAPI
  }
  return null
}

/**
 * Get app version (Electron) or fallback.
 */
export async function getAppVersion(): Promise<string> {
  if (isElectron) {
    const api = getElectronAPI()
    if (api) {
      return await api.getAppVersion()
    }
  }
  return '1.0.0' // Fallback version
}

/**
 * Get app data path (Electron) or fallback.
 */
export async function getAppPath(): Promise<string> {
  if (isElectron) {
    const api = getElectronAPI()
    if (api) {
      return await api.getAppPath()
    }
  }
  return '' // Fallback
}

/**
 * Get platform (Electron) or browser platform.
 */
export function getPlatform(): string {
  if (isElectron) {
    const api = getElectronAPI()
    if (api) {
      return api.platform
    }
  }
  return navigator.platform.toLowerCase()
}

