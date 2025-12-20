/**
 * API client for unit of measures.
 */
import apiClient from './client'

export interface UnitOfMeasure {
  id: number
  name: string
  abbreviation: string
  type: string
  is_active: boolean
}

export async function listUnitOfMeasures(activeOnly: boolean = true): Promise<UnitOfMeasure[]> {
  const response = await apiClient.get('/api/v1/unit-of-measures', {
    params: { active_only: activeOnly },
  })
  return response.data
}

