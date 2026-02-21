import apiClient from './client'

export interface Setting {
  key: string
  value: string | any
  store_id?: number
}

export async function getGlobalSettings(): Promise<Setting[]> {
  const response = await apiClient.get<Setting[]>('/api/v1/settings')
  return response.data
}
