/**
 * Registration utilities for cashier registration.
 */
const REGISTRATION_KEY = 'pos_registration'
const REGISTRATION_CODE_KEY = 'pos_registration_code'
const REGISTRATION_PROGRESS_KEY = 'pos_registration_progress'

export type RegistrationStep = 'welcome' | 'credentials' | 'store' | 'sync' | 'createUser' | 'success'

export interface RegistrationData {
  registrationCode: string
  storeId: number
  storeName: string
  userId: number
  username: string
  registeredAt: string
  registrationToken?: string
  cashRegisterId?: number
}

export interface RegistrationProgress {
  currentStep: RegistrationStep
  adminToken: string | null
  adminUsername: string
  selectedStoreId: number | null
  cashRegisterId: number | null
  cashierName: string
  storeName: string
  syncCompleted: boolean
  selectedLanguage?: string
}

/**
 * Check if cashier is registered.
 */
export function isRegistered(): boolean {
  return !!localStorage.getItem(REGISTRATION_KEY)
}

/**
 * Get registration data.
 */
export function getRegistration(): RegistrationData | null {
  const data = localStorage.getItem(REGISTRATION_KEY)
  if (!data) return null
  
  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to parse registration data:', error)
    return null
  }
}

/**
 * Save registration data.
 */
export function saveRegistration(data: RegistrationData): void {
  localStorage.setItem(REGISTRATION_KEY, JSON.stringify(data))
  // Clear progress when registration is complete
  clearRegistrationProgress()
}

/**
 * Clear registration data.
 * Also clears hardware ID to force regeneration on next registration.
 */
export function clearRegistration(): void {
  localStorage.removeItem(REGISTRATION_KEY)
  localStorage.removeItem(REGISTRATION_CODE_KEY)
  // Also clear hardware ID so it regenerates
  localStorage.removeItem('pos_hardware_id')
}

/**
 * Check if registration data exists in localStorage.
 * Useful for debugging.
 */
export function hasRegistrationData(): boolean {
  return !!localStorage.getItem(REGISTRATION_KEY)
}

/**
 * Get all registration-related localStorage keys.
 * Useful for debugging.
 */
export function getRegistrationStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('registration') || key.includes('pos_') || key.includes('hardware'))) {
      keys.push(key)
    }
  }
  return keys
}

/**
 * Get or generate registration code.
 */
export async function getRegistrationCode(): Promise<string> {
  const stored = localStorage.getItem(REGISTRATION_CODE_KEY)
  if (stored) {
    return stored
  }
  
  // Generate from hardware ID
  const { generateHardwareId } = await import('./hardwareId')
  const hardwareId = await generateHardwareId()
  const registrationCode = `REG-${hardwareId}`
  
  localStorage.setItem(REGISTRATION_CODE_KEY, registrationCode)
  return registrationCode
}

/**
 * Save registration progress.
 */
export function saveRegistrationProgress(progress: RegistrationProgress): void {
  localStorage.setItem(REGISTRATION_PROGRESS_KEY, JSON.stringify(progress))
}

/**
 * Get registration progress.
 */
export function getRegistrationProgress(): RegistrationProgress | null {
  const data = localStorage.getItem(REGISTRATION_PROGRESS_KEY)
  if (!data) return null
  
  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to parse registration progress:', error)
    return null
  }
}

/**
 * Clear registration progress.
 */
export function clearRegistrationProgress(): void {
  localStorage.removeItem(REGISTRATION_PROGRESS_KEY)
}

