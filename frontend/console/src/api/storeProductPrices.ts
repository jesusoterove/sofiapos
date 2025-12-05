/**
 * API client for store product prices management.
 */
import apiClient from './client'

export interface StoreProductPrice {
  id: number
  store_id: number
  product_id: number
  selling_price: number
  store_name?: string
  created_at: string
  updated_at: string | null
}

export interface StoreProductPriceCreate {
  store_id: number
  product_id: number
  selling_price: number
}

export interface StoreProductPriceUpdate {
  selling_price?: number
}

export const storeProductPricesApi = {
  list: async (product_id: number): Promise<StoreProductPrice[]> => {
    const response = await apiClient.get(`/api/v1/products/${product_id}/store-prices`)
    return response.data
  },

  get: async (id: number): Promise<StoreProductPrice> => {
    const response = await apiClient.get(`/api/v1/store-product-prices/${id}`)
    return response.data
  },

  create: async (data: StoreProductPriceCreate): Promise<StoreProductPrice> => {
    const response = await apiClient.post('/api/v1/store-product-prices', data)
    return response.data
  },

  update: async (id: number, data: StoreProductPriceUpdate): Promise<StoreProductPrice> => {
    const response = await apiClient.put(`/api/v1/store-product-prices/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/store-product-prices/${id}`)
  },
}

