/**
 * Recipes API client.
 */
import apiClient from './client'

export interface Recipe {
  id: number
  product_id: number
  name: string
  description?: string
  yield_quantity: number
  yield_unit_of_measure_id?: number
  is_active: boolean
  updated_at: string
}

export interface RecipeMaterial {
  id: number
  recipe_id: number
  material_id: number
  quantity: number
  unit_of_measure_id?: number
  display_order: number
  updated_at: string
}

export async function listRecipes(productId?: number): Promise<Recipe[]> {
  const response = await apiClient.get<Recipe[]>('/api/v1/recipes', {
    params: {
      active_only: true,
      ...(productId ? { product_id: productId } : {}),
    },
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  return response.data
}

export async function getRecipeMaterials(recipeId: number): Promise<RecipeMaterial[]> {
  const response = await apiClient.get<RecipeMaterial[]>(`/api/v1/recipes/${recipeId}/materials`, {
    metadata: {
      isSyncRequest: true, // Mark as sync request to prevent auto-redirect on 401
    },
  } as any)
  return response.data
}

