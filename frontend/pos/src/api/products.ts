/**
 * Products API client.
 */
import apiClient from './client'

export interface Product {
  id: number
  code: string
  name: string
  description?: string
  selling_price: number
  product_type: string
  category_id?: number
  is_active: boolean
  tax_rate: number
  created_at: string
  updated_at: string
}

export async function listProducts(activeOnly: boolean = true): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/api/v1/products', {
    params: {
      active_only: activeOnly,
      limit: 1000, // Get all products
    },
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  return response.data
}

