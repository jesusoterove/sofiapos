/**
 * User API client functions.
 */
import apiClient from './client'

export interface Role {
  id: number
  name: string
  description?: string
}

export interface Store {
  id: number
  name: string
  code: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  phone?: string
  store_id?: number
  is_active: boolean
  is_superuser: boolean
  role_ids: number[]
  roles: Role[]
  store?: Store
  created_at: string
  updated_at?: string
  last_login?: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
  full_name?: string
  phone?: string
  store_id?: number
  is_active: boolean
  is_superuser: boolean
  role_ids: number[]
}

export interface UserUpdate {
  username?: string
  email?: string
  full_name?: string
  phone?: string
  store_id?: number
  is_active?: boolean
  is_superuser?: boolean
  password?: string
  role_ids?: number[]
}

export interface UserDeleteRequest {
  password: string
  force: boolean
}

export interface UserDeleteResponse {
  deleted: boolean
  message: string
  deleted_physically: boolean
}

export interface UserTransactionInfo {
  has_transactions: boolean
  orders_count: number
  payments_count: number
  shifts_count: number
}

export const usersApi = {
  list: async (activeOnly: boolean = false, storeId?: number): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/v1/users', {
      params: { active_only: activeOnly, store_id: storeId },
    })
    return response.data
  },

  get: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/users/${id}`)
    return response.data
  },

  create: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/api/v1/users', data)
    return response.data
  },

  update: async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}`, data)
    return response.data
  },

  delete: async (id: number, password: string, force: boolean = false): Promise<UserDeleteResponse> => {
    const response = await apiClient.request<UserDeleteResponse>({
      method: 'DELETE',
      url: `/api/v1/users/${id}`,
      data: { password, force },
    })
    return response.data
  },

  getTransactionInfo: async (id: number): Promise<UserTransactionInfo> => {
    const response = await apiClient.get<UserTransactionInfo>(`/api/v1/users/${id}/transactions`)
    return response.data
  },

  listRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/api/v1/users/roles/list')
    return response.data
  },
}

