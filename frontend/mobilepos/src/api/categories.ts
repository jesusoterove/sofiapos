import apiClient from './client'

export interface ProductCategory {
  id: number
  name: string
  description?: string
  updated_at?: string
}

export async function listProductCategories(activeOnly = true): Promise<ProductCategory[]> {
  const response = await apiClient.get<ProductCategory[]>('/api/v1/product-categories', {
    params: { active_only: activeOnly, limit: 10000 },
  })
  return response.data
}
