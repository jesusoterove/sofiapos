/**
 * Cash Registers API client functions.
 */
import apiClient from './client'

export interface CashRegister {
  id: number
  store_id: number
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export const cashRegistersApi = {
  list: async (storeId?: number): Promise<CashRegister[]> => {
    const params = storeId ? { store_id: storeId } : {}
    const response = await apiClient.get<CashRegister[]>('/api/v1/cash_registers/list', { params })
    return response.data
  },
}

