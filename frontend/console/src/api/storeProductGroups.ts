/**
 * API client for store product groups management.
 */
import apiClient from './client'

export interface StoreProductGroup {
  id: number
  store_id: number
  group_name: string
  created_at: string
  updated_at: string | null
}

export interface StoreProductGroupCreate {
  store_id: number
  group_name: string
}

export interface StoreProductGroupUpdate {
  group_name?: string
}

export interface ProductGroupAssignment {
  product_id: number
  group_id: number
  assigned: boolean
}

export const storeProductGroupsApi = {
  list: async (store_id?: number): Promise<StoreProductGroup[]> => {
    const response = await apiClient.get('/api/v1/store-product-groups', {
      params: { store_id },
    })
    return response.data
  },

  get: async (id: number): Promise<StoreProductGroup> => {
    const response = await apiClient.get(`/api/v1/store-product-groups/${id}`)
    return response.data
  },

  create: async (data: StoreProductGroupCreate): Promise<StoreProductGroup> => {
    const response = await apiClient.post('/api/v1/store-product-groups', data)
    return response.data
  },

  update: async (id: number, data: StoreProductGroupUpdate): Promise<StoreProductGroup> => {
    const response = await apiClient.put(`/api/v1/store-product-groups/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/store-product-groups/${id}`)
  },

  assignProduct: async (productId: number, groupId: number, assigned: boolean): Promise<void> => {
    await apiClient.post(`/api/v1/products/${productId}/groups`, {
      group_id: groupId,
      assigned,
    })
  },

  getProductGroups: async (productId: number): Promise<StoreProductGroup[]> => {
    const response = await apiClient.get(`/api/v1/products/${productId}/groups`)
    return response.data
  },
}

