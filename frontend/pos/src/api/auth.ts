/**
 * Authentication API client.
 */
import apiClient from './client'

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<RefreshTokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  })
  return response.data
}

