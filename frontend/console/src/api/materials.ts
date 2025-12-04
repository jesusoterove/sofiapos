/**
 * API client for materials (ingredients) management.
 */
import apiClient from './client'

export interface Material {
  id: number
  name: string
  code: string | null
  description: string | null
  requires_inventory: boolean
  created_at: string
  updated_at: string | null
}

export interface MaterialCreate {
  name: string
  code?: string | null
  description?: string | null
  requires_inventory?: boolean
}

export interface MaterialUpdate {
  name?: string
  code?: string | null
  description?: string | null
  requires_inventory?: boolean
}

export const materialsApi = {
  list: async (skip: number = 0, limit: number = 100): Promise<Material[]> => {
    const response = await apiClient.get('/api/v1/materials', {
      params: { skip, limit },
    })
    return response.data
  },

  get: async (id: number): Promise<Material> => {
    const response = await apiClient.get(`/api/v1/materials/${id}`)
    return response.data
  },

  create: async (data: MaterialCreate): Promise<Material> => {
    const response = await apiClient.post('/api/v1/materials', data)
    return response.data
  },

  update: async (id: number, data: MaterialUpdate): Promise<Material> => {
    const response = await apiClient.put(`/api/v1/materials/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/materials/${id}`)
  },
}

