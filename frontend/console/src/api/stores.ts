/**
 * Store API client functions.
 */
import apiClient from './client'

export interface Store {
  id: number
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  is_active: boolean
  default_tables_count: number
  requires_start_inventory: boolean
  requires_end_inventory: boolean
  created_at: string
  updated_at?: string
}

export interface StoreCreate {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  default_tables_count: number
  requires_start_inventory: boolean
  requires_end_inventory: boolean
}

export interface StoreUpdate {
  name?: string
  code?: string
  address?: string
  phone?: string
  email?: string
  is_active?: boolean
  default_tables_count?: number
  requires_start_inventory?: boolean
  requires_end_inventory?: boolean
}

export interface StoreDeleteRequest {
  password: string
  force: boolean
}

export interface StoreDeleteResponse {
  deleted: boolean
  message: string
  deleted_physically: boolean
}

export interface StoreTransactionInfo {
  has_transactions: boolean
  orders_count: number
  users_count: number
  products_count: number
  shifts_count: number
  inventory_entries_count: number
}

export const storesApi = {
  list: async (activeOnly: boolean = false): Promise<Store[]> => {
    const response = await apiClient.get<Store[]>('/api/v1/stores', {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  get: async (id: number): Promise<Store> => {
    const response = await apiClient.get<Store>(`/api/v1/stores/${id}`)
    return response.data
  },

  create: async (data: StoreCreate): Promise<Store> => {
    const response = await apiClient.post<Store>('/api/v1/stores', data)
    return response.data
  },

  update: async (id: number, data: StoreUpdate): Promise<Store> => {
    const response = await apiClient.put<Store>(`/api/v1/stores/${id}`, data)
    return response.data
  },

  delete: async (id: number, password: string, force: boolean = false): Promise<StoreDeleteResponse> => {
    const response = await apiClient.request<StoreDeleteResponse>({
      method: 'DELETE',
      url: `/api/v1/stores/${id}`,
      data: { password, force },
    })
    return response.data
  },

  getTransactionInfo: async (id: number): Promise<StoreTransactionInfo> => {
    const response = await apiClient.get<StoreTransactionInfo>(`/api/v1/stores/${id}/transactions`)
    return response.data
  },
}

