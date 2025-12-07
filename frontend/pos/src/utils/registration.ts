/**
 * Registration utilities for cashier registration.
 */
const REGISTRATION_KEY = 'pos_registration'
const REGISTRATION_CODE_KEY = 'pos_registration_code'

export interface RegistrationData {
  registrationCode: string
  storeId: number
  storeName: string
  userId: number
  username: string
  registeredAt: string
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
}

/**
 * Clear registration data.
 */
export function clearRegistration(): void {
  localStorage.removeItem(REGISTRATION_KEY)
  localStorage.removeItem(REGISTRATION_CODE_KEY)
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

