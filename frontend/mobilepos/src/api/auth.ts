import apiClient from './client'

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  user: {
    id: number
    username: string
    email: string
    full_name: string | null
    is_active: boolean
    store_id: number | null
  }
}

export interface Store {
  id: number
  name: string
  code: string
  is_active: boolean
}

export interface CashRegister {
  id: number
  code: string
  store_id: number
  name?: string
  is_active: boolean
}

export async function loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)

  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipAuth: true,
  })
  return response.data
}

export async function fetchStores(token: string): Promise<Store[]> {
  const response = await apiClient.get<Store[]>('/api/v1/stores', {
    headers: { Authorization: `Bearer ${token}` },
    skipAuth: true,
  })
  return response.data
}

export async function registerCashRegister(
  storeId: number,
  hardwareId: string,
  token: string
): Promise<CashRegister> {
  const response = await apiClient.post<CashRegister>(
    '/api/v1/cash-registers/register',
    { store_id: storeId, hardware_id: hardwareId },
    { headers: { Authorization: `Bearer ${token}` }, skipAuth: true }
  )
  return response.data
}

export async function createUser(
  data: {
    username: string
    password: string
    email?: string
    full_name: string
    store_id: number
  },
  token: string
): Promise<{ id: number; username: string }> {
  const response = await apiClient.post('/api/v1/users', data, {
    headers: { Authorization: `Bearer ${token}` },
    skipAuth: true,
  })
  return response.data
}
