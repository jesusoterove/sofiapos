/**
 * Product categories API client.
 */
import apiClient from './client'

export interface ProductCategory {
  id: number
  name: string
  description?: string
  parent_id?: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listProductCategories(activeOnly: boolean = true): Promise<ProductCategory[]> {
  const response = await apiClient.get<ProductCategory[]>('/api/v1/product-categories', {
    params: {
      active_only: activeOnly,
    },
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  return response.data
}

