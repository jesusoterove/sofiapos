import { getSecureJSON, setSecureJSON, removeSecure, SECURE_KEYS } from './secureStorage'

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
  cashRegisterCode?: string
}

export interface RegistrationProgress {
  currentStep: RegistrationStep
  adminToken: string | null
  adminUsername: string
  selectedStoreId: number | null
  cashRegisterId: number | null
  cashRegisterCode: string | null
  cashierName: string
  storeName: string
  syncCompleted: boolean
  selectedLanguage?: string
}

export async function isRegistered(): Promise<boolean> {
  const data = await getSecureJSON<RegistrationData>(SECURE_KEYS.REGISTRATION)
  return data !== null
}

export async function getRegistration(): Promise<RegistrationData | null> {
  return getSecureJSON<RegistrationData>(SECURE_KEYS.REGISTRATION)
}

export async function saveRegistration(data: RegistrationData): Promise<void> {
  await setSecureJSON(SECURE_KEYS.REGISTRATION, data)
  await clearRegistrationProgress()
}

export async function clearRegistration(): Promise<void> {
  await removeSecure(SECURE_KEYS.REGISTRATION)
  await removeSecure(SECURE_KEYS.HARDWARE_ID)
}

export async function getRegistrationProgress(): Promise<RegistrationProgress | null> {
  return getSecureJSON<RegistrationProgress>(SECURE_KEYS.REGISTRATION_PROGRESS)
}

export async function saveRegistrationProgress(progress: RegistrationProgress): Promise<void> {
  await setSecureJSON(SECURE_KEYS.REGISTRATION_PROGRESS, progress)
}

export async function clearRegistrationProgress(): Promise<void> {
  await removeSecure(SECURE_KEYS.REGISTRATION_PROGRESS)
}
