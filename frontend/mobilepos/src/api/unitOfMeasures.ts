import apiClient from './client'

export async function listUnitOfMeasures(activeOnly = true): Promise<any[]> {
  const response = await apiClient.get('/api/v1/unit-of-measures', {
    params: { active_only: activeOnly, limit: 10000 },
  })
  return response.data
}

export async function listProductUnitOfMeasures(): Promise<any[]> {
  const response = await apiClient.get('/api/v1/product-unit-of-measures', {
    params: { limit: 10000 },
  })
  return response.data
}

export async function listMaterialUnitOfMeasures(): Promise<any[]> {
  const response = await apiClient.get('/api/v1/material-unit-of-measures', {
    params: { limit: 10000 },
  })
  return response.data
}
