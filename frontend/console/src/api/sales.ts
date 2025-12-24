/**
 * Sales API client.
 */
import apiClient from './client'
import type { SalesFilterRequest, SalesDetailsRequest, SalesResponse, SalesSummaryResponse, SalesDetailsResponse } from '@/types/sales'

export async function getSales(filterData: SalesFilterRequest): Promise<SalesResponse> {
  const response = await apiClient.post<SalesResponse>('/api/v1/sales/', filterData)
  return response.data
}

export async function getSalesSummary(filterData: SalesFilterRequest): Promise<SalesSummaryResponse> {
  const response = await apiClient.post<SalesSummaryResponse>('/api/v1/sales/summary', filterData)
  return response.data
}

export async function getSalesDetails(filterData: SalesDetailsRequest): Promise<SalesDetailsResponse> {
  const response = await apiClient.post<SalesDetailsResponse>('/api/v1/sales/details', filterData)
  return response.data
}

