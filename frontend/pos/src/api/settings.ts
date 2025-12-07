/**
 * Settings API client.
 */
import apiClient from './client'

export interface Setting {
  key: string
  value: string | number | boolean | object
  store_id?: number
}

export async function getGlobalSettings(): Promise<Setting[]> {
  const response = await apiClient.get<{ settings: Record<string, any> }>('/api/v1/settings/global', {
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  // Convert dictionary to array
  const settingsArray: Setting[] = Object.entries(response.data.settings || {}).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
    store_id: undefined,
  }))
  return settingsArray
}

