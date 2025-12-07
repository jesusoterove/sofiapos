/**
 * Token refresh service for handling access token refresh.
 */
import { refreshAccessToken } from '../api/auth'

const AUTH_TOKEN_KEY = 'pos_auth_token'
const REFRESH_TOKEN_KEY = 'pos_refresh_token'

/**
 * Refresh the access token using the stored refresh token.
 * Returns the new access token or null if refresh fails.
 */
export async function refreshToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      return null
    }

    const response = await refreshAccessToken(refreshToken)
    
    // Store new access token
    if (response.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.access_token)
      return response.access_token
    }
    
    return null
  } catch (error) {
    // Refresh token is invalid or expired
    console.error('Token refresh failed:', error)
    return null
  }
}

/**
 * Get the current access token, refreshing if necessary.
 * Returns null if token cannot be obtained.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  
  // If we have an access token, return it (we'll let the API handle expiration)
  if (accessToken) {
    return accessToken
  }
  
  // If we have a refresh token, try to refresh
  if (refreshToken) {
    return await refreshToken()
  }
  
  return null
}

