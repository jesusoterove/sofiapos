import apiClient from './client'

export interface Material {
  id: number
  name: string
  description?: string
  unit_of_measure_id?: number
  unit_cost?: number
  vendor_id?: number
  is_active?: boolean
  updated_at?: string
}

export async function listMaterials(): Promise<Material[]> {
  const response = await apiClient.get<Material[]>('/api/v1/materials', {
    params: { limit: 10000 },
  })
  return response.data
}
