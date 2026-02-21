import apiClient from './client'

export async function listRecipes(): Promise<any[]> {
  const response = await apiClient.get('/api/v1/recipes', { params: { limit: 10000 } })
  return response.data
}

export async function getRecipeMaterials(recipeId: number): Promise<any[]> {
  const response = await apiClient.get(`/api/v1/recipes/${recipeId}/materials`)
  return response.data
}
