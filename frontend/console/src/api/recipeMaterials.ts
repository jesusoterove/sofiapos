/**
 * API client for recipe materials management.
 */
import apiClient from './client'

export interface RecipeMaterial {
  id: number
  recipe_id: number
  material_id: number
  quantity: number
  unit_of_measure_id: number | null
  display_order: number
  material_name?: string
  material_code?: string
  unit_of_measure_name?: string
  created_at: string
  updated_at: string | null
}

export interface RecipeMaterialCreate {
  recipe_id: number
  material_id: number
  quantity: number
  unit_of_measure_id?: number | null
}

export interface RecipeMaterialUpdate {
  quantity?: number
  unit_of_measure_id?: number | null
}

export const recipeMaterialsApi = {
  list: async (product_id: number): Promise<RecipeMaterial[]> => {
    const response = await apiClient.get(`/api/v1/products/${product_id}/recipe-materials`)
    return response.data
  },

  create: async (product_id: number, data: RecipeMaterialCreate): Promise<RecipeMaterial> => {
    const response = await apiClient.post(`/api/v1/products/${product_id}/recipe-materials`, data)
    return response.data
  },

  update: async (product_id: number, material_id: number, data: RecipeMaterialUpdate): Promise<RecipeMaterial> => {
    const response = await apiClient.put(`/api/v1/products/${product_id}/recipe-materials/${material_id}`, data)
    return response.data
  },

  delete: async (product_id: number, material_id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/products/${product_id}/recipe-materials/${material_id}`)
  },
}

