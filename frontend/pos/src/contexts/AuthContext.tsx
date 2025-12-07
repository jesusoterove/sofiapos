/**
 * Authentication context for POS application with offline-first support.
 * Supports online login to generate local password, and offline login using local password.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import apiClient from '@/api/client'
import { openDatabase } from '@/db'

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

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have stored user data
      const storedUserData = localStorage.getItem(USER_DATA_KEY)
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } catch (error) {
          console.error('Failed to parse stored user data:', error)
          localStorage.removeItem(USER_DATA_KEY)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
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
      
      const { access_token, user: userData } = response.data
      
      // Store auth token
      localStorage.setItem(AUTH_TOKEN_KEY, access_token)
      
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
  }

  const generateLocalPassword = async (onlinePassword: string): Promise<string> => {
    // Generate a hash from the online password
    return await hashPassword(onlinePassword)
  }

  const verifyLocalPassword = async (inputPassword: string, storedHash: string): Promise<boolean> => {
    const inputHash = await hashPassword(inputPassword)
    return inputHash === storedHash
  }

  const loginOffline = async (localPassword: string): Promise<boolean> => {
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
          console.error('Failed to parse stored user data:', error)
          return false
        }
      }
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    // Note: We keep LOCAL_PASSWORD_KEY so user can login offline again
    setUser(null)
  }

  const hasLocalPassword = !!localStorage.getItem(LOCAL_PASSWORD_KEY)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginOffline,
        logout,
        hasLocalPassword,
        generateLocalPassword,
        verifyLocalPassword,
      }}
    >
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

