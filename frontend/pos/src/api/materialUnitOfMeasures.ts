/**
 * API client for material unit of measures.
 */
import apiClient from './client'

export interface MaterialUnitOfMeasure {
  id: number
  material_id: number
  unit_of_measure_id: number
  conversion_factor: number
  is_base_unit: boolean
  display_order: number
}

export async function listMaterialUnitOfMeasures(materialId?: number): Promise<MaterialUnitOfMeasure[]> {
  const response = await apiClient.get('/api/v1/material-unit-of-measures', {
    params: materialId ? { material_id: materialId } : {},
  })
  return response.data
}

