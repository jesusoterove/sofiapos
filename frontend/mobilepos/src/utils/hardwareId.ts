import * as Device from 'expo-device'
import * as Application from 'expo-application'
import * as Crypto from 'expo-crypto'
import { Platform } from 'react-native'
import { getSecure, setSecure, SECURE_KEYS } from './secureStorage'

export async function generateHardwareId(): Promise<string> {
  const stored = await getSecure(SECURE_KEYS.HARDWARE_ID)
  if (stored) return stored

  const components: string[] = []

  components.push(Platform.OS)
  components.push(Platform.Version?.toString() ?? 'unknown')
  components.push(Device.brand ?? 'unknown')
  components.push(Device.modelName ?? 'unknown')
  components.push(Device.deviceName ?? 'unknown')
  components.push(Device.osName ?? 'unknown')
  components.push(Device.osVersion ?? 'unknown')
  components.push(Application.applicationId ?? 'unknown')

  if (Platform.OS === 'android') {
    const androidId = Application.getAndroidId()
    if (androidId) components.push(androidId)
  }

  const combined = components.join('|')
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  )

  const hardwareId = `MPOS-${hash.substring(0, 16).toUpperCase()}`
  await setSecure(SECURE_KEYS.HARDWARE_ID, hardwareId)
  return hardwareId
}

export async function getHardwareId(): Promise<string> {
  return generateHardwareId()
}

export async function clearHardwareId(): Promise<void> {
  const { removeSecure, SECURE_KEYS: KEYS } = await import('./secureStorage')
  await removeSecure(KEYS.HARDWARE_ID)
}
