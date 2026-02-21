import * as SecureStore from 'expo-secure-store'

const KEYS = {
  AUTH_TOKEN: 'pos_auth_token',
  REFRESH_TOKEN: 'pos_refresh_token',
  LOCAL_PASSWORD_HASH: 'pos_local_password_hash',
  USER_DATA: 'pos_user_data',
  REGISTRATION: 'pos_registration',
  REGISTRATION_PROGRESS: 'pos_registration_progress',
  HARDWARE_ID: 'pos_hardware_id',
} as const

export type SecureKey = (typeof KEYS)[keyof typeof KEYS]

export async function getSecure(key: SecureKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function setSecure(key: SecureKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value)
}

export async function removeSecure(key: SecureKey): Promise<void> {
  await SecureStore.deleteItemAsync(key)
}

export async function getSecureJSON<T>(key: SecureKey): Promise<T | null> {
  const raw = await getSecure(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setSecureJSON(key: SecureKey, value: unknown): Promise<void> {
  await setSecure(key, JSON.stringify(value))
}

export { KEYS as SECURE_KEYS }
