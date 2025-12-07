/**
 * Materials (Vendors) API client.
 */
import apiClient from './client'

export interface Material {
  id: number
  name: string
  description?: string
  unit_of_measure_id?: number
  unit_cost?: number
  vendor_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listMaterials(): Promise<Material[]> {
  const response = await apiClient.get<Material[]>('/api/v1/materials', {
    params: {
      limit: 1000, // Get all materials
    },
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  return response.data
}

