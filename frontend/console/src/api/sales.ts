/**
 * Sales API client.
 */
import apiClient from './client'
import type { SalesFilterRequest, SalesResponse } from '@/types/sales'

export async function getSales(filterData: SalesFilterRequest): Promise<SalesResponse> {
  const response = await apiClient.post<SalesResponse>('/api/v1/sales/', filterData)
  return response.data
}

