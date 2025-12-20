/**
 * API client for product unit of measures.
 */
import apiClient from './client'

export interface ProductUnitOfMeasure {
  id: number
  product_id: number
  unit_of_measure_id: number
  conversion_factor: number
  is_base_unit: boolean
  display_order: number
}

export async function listProductUnitOfMeasures(productId?: number): Promise<ProductUnitOfMeasure[]> {
  const response = await apiClient.get('/api/v1/product-unit-of-measures', {
    params: productId ? { product_id: productId } : {},
  })
  return response.data
}

