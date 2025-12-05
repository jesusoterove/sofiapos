/**
 * API client for kit components management.
 */
import apiClient from './client'

export interface KitComponent {
  id: number
  product_id: number
  component_id: number
  quantity: number
  component_name?: string
  component_code?: string
  created_at: string
  updated_at: string | null
}

export interface KitComponentCreate {
  product_id: number
  component_id: number
  quantity: number
}

export interface KitComponentUpdate {
  quantity?: number
}

export const kitComponentsApi = {
  list: async (product_id: number): Promise<KitComponent[]> => {
    const response = await apiClient.get(`/api/v1/products/${product_id}/kit-components`)
    return response.data
  },

  get: async (id: number): Promise<KitComponent> => {
    const response = await apiClient.get(`/api/v1/kit-components/${id}`)
    return response.data
  },

  create: async (data: KitComponentCreate): Promise<KitComponent> => {
    const response = await apiClient.post('/api/v1/kit-components', data)
    return response.data
  },

  update: async (id: number, data: KitComponentUpdate): Promise<KitComponent> => {
    const response = await apiClient.put(`/api/v1/kit-components/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/kit-components/${id}`)
  },
}

