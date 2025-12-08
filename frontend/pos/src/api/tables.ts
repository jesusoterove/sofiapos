/**
 * Tables API client.
 */
import apiClient from './client'

export interface Table {
  id: number
  store_id: number
  table_number: string
  name: string | null
  capacity: number
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export async function listTables(storeId?: number, activeOnly: boolean = true): Promise<Table[]> {
  const response = await apiClient.get<Table[]>('/api/v1/tables', {
    params: {
      store_id: storeId,
      active_only: activeOnly,
    },
  } as any)
  return response.data
}

