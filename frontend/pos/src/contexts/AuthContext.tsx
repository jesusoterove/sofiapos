/**
 * Authentication context for POS application with offline-first support.
 * Supports online login to generate local password, and offline login using local password.
 */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react'
import apiClient from '@/api/client'

interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  is_active: boolean
  store_id: number | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  loginOffline: (localPassword: string) => Promise<boolean>
  logout: () => void
  hasLocalPassword: boolean
  generateLocalPassword: (onlinePassword: string) => Promise<string>
  verifyLocalPassword: (inputPassword: string, storedHash: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_PASSWORD_KEY = 'pos_local_password_hash'
const USER_DATA_KEY = 'pos_user_data'
const AUTH_TOKEN_KEY = 'pos_auth_token'
const REFRESH_TOKEN_KEY = 'pos_refresh_token'
const AUTH_INITIALIZED_KEY = 'pos_auth_initialized'

// Utility function to wait for auth initialization (for use in beforeLoad)
// This checks if AuthContext has finished initializing by looking for a flag
export async function waitForAuthInitialization(maxWaitMs: number = 1000): Promise<boolean> {
  const startTime = Date.now()
  
  // Check if already initialized (flag set by AuthContext)
  if (localStorage.getItem(AUTH_INITIALIZED_KEY) === 'true') {
    return true
  }
  
  // Poll for initialization flag
  while (Date.now() - startTime < maxWaitMs) {
    if (localStorage.getItem(AUTH_INITIALIZED_KEY) === 'true') {
      return true
    }
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  // If we've waited too long, assume initialization is complete (or failed)
  // AuthContext initialization is very fast (just reading localStorage)
  return true
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isInitializedRef = useRef(false)

  // Check for existing auth on mount - only once
  useEffect(() => {
    // Prevent multiple initializations (e.g., from React Strict Mode)
    if (isInitializedRef.current) {
      console.log('[AuthContext] Already initialized, skipping')
      return
    }

    isInitializedRef.current = true
    console.log('[AuthContext] Initializing...')

    const checkAuth = async () => {
      // Check if we have stored user data
      const storedUserData = localStorage.getItem(USER_DATA_KEY)
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
          console.log('[AuthContext] Restored user from localStorage:', userData.username)
        } catch (error) {
          console.error('[AuthContext] Failed to parse stored user data:', error)
          localStorage.removeItem(USER_DATA_KEY)
        }
      }
      setIsLoading(false)
      // Set flag to indicate initialization is complete (for beforeLoad hooks)
      localStorage.setItem(AUTH_INITIALIZED_KEY, 'true')
      console.log('[AuthContext] Initialization complete')
    }
    
    checkAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      // Check if online
      if (!navigator.onLine) {
        throw new Error('Must be online for initial login')
      }

      // Use form data for OAuth2PasswordRequestForm compatibility
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await apiClient.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const { access_token, refresh_token, user: userData } = response.data
      
      // Store auth token and refresh token
      localStorage.setItem(AUTH_TOKEN_KEY, access_token)
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
      }
      
      // Convert user data to User type
      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        is_active: userData.is_active,
        store_id: userData.store_id,
      }
      
      // Store user data
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
      
      // Generate and store local password hash
      const localPasswordHash = await hashPassword(password)
      localStorage.setItem(LOCAL_PASSWORD_KEY, localPasswordHash)
      
      setUser(user)
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }, [])

  const generateLocalPassword = useCallback(async (onlinePassword: string): Promise<string> => {
    // Generate a hash from the online password
    return await hashPassword(onlinePassword)
  }, [])

  const verifyLocalPassword = useCallback(async (inputPassword: string, storedHash: string): Promise<boolean> => {
    const inputHash = await hashPassword(inputPassword)
    return inputHash === storedHash
  }, [])

  const loginOffline = useCallback(async (localPassword: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(LOCAL_PASSWORD_KEY)
    if (!storedHash) {
      return false
    }

    const isValid = await verifyLocalPassword(localPassword, storedHash)
    if (isValid) {
      // Restore user from localStorage
      const storedUserData = localStorage.getItem(USER_DATA_KEY)
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
          return true
        } catch (error) {
          console.error('[AuthContext] Failed to parse stored user data:', error)
          return false
        }
      }
    }
    return false
  }, [verifyLocalPassword])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    // Note: We keep LOCAL_PASSWORD_KEY so user can login offline again
    // Keep AUTH_INITIALIZED_KEY so beforeLoad knows auth has been initialized
    setUser(null)
  }, [])

  // Memoize hasLocalPassword to avoid recalculating on every render
  const hasLocalPassword = useMemo(() => {
    return !!localStorage.getItem(LOCAL_PASSWORD_KEY)
  }, [user]) // Recalculate only when user changes (login/logout)

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginOffline,
      logout,
      hasLocalPassword,
      generateLocalPassword,
      verifyLocalPassword,
    }),
    [user, isLoading, hasLocalPassword, login, loginOffline, logout, generateLocalPassword, verifyLocalPassword]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

