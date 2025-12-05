/**
 * Authentication context for managing user authentication state.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing auth token on mount
  useEffect(() => {
    // Don't try to fetch user if we're on the login page
    // This prevents infinite redirect loops when session is lost
    const currentPath = window.location.pathname
    if (currentPath === '/login' || currentPath === '/login/') {
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verify token and get user info
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/api/v1/auth/me')
      setUser(response.data)
      setIsLoading(false)
    } catch (error: any) {
      // Token invalid or expired
      // Only clear token if it's a 401 (unauthorized), not other errors
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        setUser(null)
      }
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
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
      localStorage.setItem('auth_token', access_token)
      
      // Convert user data to User type
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        is_active: userData.is_active,
        store_id: userData.store_id,
      })
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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

