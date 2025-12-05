/**
 * API client for products management.
 */
import apiClient from './client'

export type ProductType = 'sales_inventory' | 'prepared' | 'kit' | 'service' | 'misc_charges'

export interface Product {
  id: number
  name: string
  code: string | null
  description: string | null
  category_id: number | null
  product_type: ProductType
  is_active: boolean
  selling_price: number
  created_at: string
  updated_at: string | null
}

export interface ProductCreate {
  name: string
  code?: string | null
  description?: string | null
  category_id?: number | null
  product_type?: ProductType
  is_active?: boolean
  selling_price: string
}

export interface ProductUpdate {
  name?: string
  code?: string | null
  description?: string | null
  category_id?: number | null
  product_type?: ProductType
  is_active?: boolean
  selling_price?: string
}

export const productsApi = {
  list: async (
    skip: number = 0,
    limit: number = 100,
    active_only: boolean = false
  ): Promise<Product[]> => {
    const response = await apiClient.get('/api/v1/products', {
      params: { skip, limit, active_only },
    })
    return response.data
  },

  get: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/api/v1/products/${id}`)
    return response.data
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post('/api/v1/products', data)
    return response.data
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put(`/api/v1/products/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/products/${id}`)
  },
}

