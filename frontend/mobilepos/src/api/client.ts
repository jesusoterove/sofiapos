import { isOnline } from '@/utils/network'
import { getSecure, setSecure, SECURE_KEYS } from '@/utils/secureStorage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined>
  responseType?: 'json' | 'blob'
  timeout?: number
  skipAuth?: boolean
  skipTokenRefresh?: boolean
}

interface ApiResponse<T = any> {
  data: T
  status: number
  ok: boolean
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private buildURL(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value))
      })
    }
    return url.toString()
  }

  private async getAuthHeaders(config?: RequestConfig): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    }

    if (!config?.skipAuth) {
      const token = await getSecure(SECURE_KEYS.AUTH_TOKEN)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = await getSecure(SECURE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) return null

    try {
      const response = await fetch(this.buildURL('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) return null

      const data = await response.json()
      if (data.access_token) {
        await setSecure(SECURE_KEYS.AUTH_TOKEN, data.access_token)
        if (data.refresh_token) {
          await setSecure(SECURE_KEYS.REFRESH_TOKEN, data.refresh_token)
        }
        return data.access_token
      }
      return null
    } catch {
      return null
    }
  }

  private async request<T = any>(
    method: string,
    path: string,
    data?: any,
    config?: RequestConfig,
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const online = await isOnline()
    if (!online) {
      throw new Error('Offline')
    }

    const headers = await this.getAuthHeaders(config)
    const url = this.buildURL(path, config?.params)

    const fetchConfig: RequestInit = {
      method,
      headers,
    }

    if (data !== undefined && method !== 'GET') {
      if (data instanceof FormData) {
        delete (fetchConfig.headers as Record<string, string>)['Content-Type']
        fetchConfig.body = data
      } else {
        fetchConfig.body = JSON.stringify(data)
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout ?? 15000)
    fetchConfig.signal = controller.signal

    try {
      const response = await fetch(url, fetchConfig)
      clearTimeout(timeoutId)

      if (response.status === 401 && !isRetry && !config?.skipAuth && !config?.skipTokenRefresh) {
        const newToken = await this.refreshToken()
        if (newToken) {
          return this.request<T>(method, path, data, config, true)
        }
        throw new ApiError('Authentication failed', 401)
      }

      if (!response.ok) {
        let errorDetail: string | undefined
        try {
          const errorBody = await response.json()
          errorDetail = errorBody.detail || errorBody.message
        } catch { /* ignore parse errors */ }
        throw new ApiError(errorDetail || `Request failed with status ${response.status}`, response.status)
      }

      let responseData: T
      if (config?.responseType === 'blob') {
        responseData = (await response.blob()) as unknown as T
      } else {
        const text = await response.text()
        responseData = text ? JSON.parse(text) : null
      }

      return { data: responseData, status: response.status, ok: true }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ApiError) throw error
      if ((error as Error).name === 'AbortError') {
        throw new ApiError('Request timeout', 0)
      }
      throw error
    }
  }

  async get<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, config)
  }

  async post<T = any>(path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, config)
  }

  async put<T = any>(path: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, config)
  }

  async delete<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, config)
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
