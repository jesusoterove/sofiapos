/**
 * Hardware ID generation utility for unique cashier registration code.
 * Generates a unique identifier based on machine hardware characteristics.
 */
import { isElectron, getElectronAPI } from './electron'

const HARDWARE_ID_KEY = 'pos_hardware_id'

/**
 * Generate a unique hardware ID based on available machine characteristics.
 * Uses a combination of platform, user agent, screen resolution, and timezone.
 * In Electron, could use machine-specific identifiers.
 */
export async function generateHardwareId(): Promise<string> {
  // Check if we already have a stored hardware ID
  const stored = localStorage.getItem(HARDWARE_ID_KEY)
  if (stored) {
    return stored
  }

  // Try to get machine-specific ID from Electron if available
  if (isElectron) {
    const api = getElectronAPI()
    if (api && typeof api.getMachineId === 'function') {
      try {
        const machineId = await api.getMachineId()
        if (machineId) {
          localStorage.setItem(HARDWARE_ID_KEY, machineId)
          return machineId
        }
      } catch (error) {
        console.warn('Failed to get machine ID from Electron:', error)
      }
    }
  }

  // Fallback: Generate ID from available browser/machine characteristics
  const components: string[] = []

  // Platform info
  components.push(navigator.platform || 'unknown')
  components.push(navigator.userAgent || 'unknown')
  
  // Screen resolution
  components.push(`${screen.width}x${screen.height}`)
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown')
  
  // Language
  components.push(navigator.language || 'unknown')
  
  // Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 0))
  
  // Max touch points (for touch devices)
  components.push(String(navigator.maxTouchPoints || 0))

  // Combine and hash
  const combined = components.join('|')
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Take first 16 characters for a shorter ID
  const hardwareId = `POS-${hashHex.substring(0, 16).toUpperCase()}`
  
  // Store for future use
  localStorage.setItem(HARDWARE_ID_KEY, hardwareId)
  
  return hardwareId
}

/**
 * Get the stored hardware ID, or generate a new one if it doesn't exist.
 */
export async function getHardwareId(): Promise<string> {
  return generateHardwareId()
}

/**
 * Clear the stored hardware ID (for testing/reset purposes).
 */
export function clearHardwareId(): void {
  localStorage.removeItem(HARDWARE_ID_KEY)
}

