import apiClient from './client'

export async function listTables(storeId?: number, activeOnly = true): Promise<any[]> {
  const response = await apiClient.get('/api/v1/tables', {
    params: { store_id: storeId, active_only: activeOnly, limit: 1000 },
  })
  return response.data
}
