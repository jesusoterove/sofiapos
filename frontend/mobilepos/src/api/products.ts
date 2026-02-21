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
  tax_rate?: number
  updated_at?: string
}

export async function listProducts(activeOnly = true): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/api/v1/products', {
    params: { active_only: activeOnly, limit: 10000 },
  })
  return response.data
}
