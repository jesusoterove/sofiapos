/**
 * API client for settings management.
 */
import apiClient from './client'

export interface Setting {
  key: string
  value: string | number | boolean | null
  value_type: string
  description?: string | null
}

export interface GlobalSettings {
  settings: Record<string, string | number | boolean | null>
}

/**
 * Get all global settings.
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
  const response = await apiClient.get<GlobalSettings>('/api/v1/settings/global')
  return response.data
}

/**
 * Get a specific global setting by key.
 */
export async function getGlobalSetting(key: string): Promise<Setting> {
  const response = await apiClient.get<Setting>(`/api/v1/settings/global/${key}`)
  return response.data
}

