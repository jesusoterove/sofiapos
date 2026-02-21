import apiClient from './client'

export async function getInventoryControlConfig(storeId: number): Promise<any[]> {
  const response = await apiClient.get('/api/v1/inventory-control-config', {
    params: { store_id: storeId },
  })
  return response.data
}
