import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react'
import * as Crypto from 'expo-crypto'
import apiClient from '@/api/client'
import {
  getSecure, setSecure, removeSecure, getSecureJSON, setSecureJSON,
  SECURE_KEYS,
} from '@/utils/secureStorage'

export interface User {
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
  logout: () => Promise<void>
  hasLocalPassword: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLocalPw, setHasLocalPw] = useState(false)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const checkAuth = async () => {
      const userData = await getSecureJSON<User>(SECURE_KEYS.USER_DATA)
      if (userData) setUser(userData)

      const pwHash = await getSecure(SECURE_KEYS.LOCAL_PASSWORD_HASH)
      setHasLocalPw(!!pwHash)

      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await apiClient.post('/api/v1/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      skipAuth: true,
    })

    const { access_token, refresh_token, user: userData } = response.data

    await setSecure(SECURE_KEYS.AUTH_TOKEN, access_token)
    if (refresh_token) {
      await setSecure(SECURE_KEYS.REFRESH_TOKEN, refresh_token)
    }

    const u: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      full_name: userData.full_name,
      is_active: userData.is_active,
      store_id: userData.store_id,
    }

    await setSecureJSON(SECURE_KEYS.USER_DATA, u)

    const localHash = await hashPassword(password)
    await setSecure(SECURE_KEYS.LOCAL_PASSWORD_HASH, localHash)
    setHasLocalPw(true)

    setUser(u)
  }, [])

  const loginOffline = useCallback(async (localPassword: string): Promise<boolean> => {
    const storedHash = await getSecure(SECURE_KEYS.LOCAL_PASSWORD_HASH)
    if (!storedHash) return false

    const inputHash = await hashPassword(localPassword)
    if (inputHash !== storedHash) return false

    const userData = await getSecureJSON<User>(SECURE_KEYS.USER_DATA)
    if (!userData) return false

    setUser(userData)
    return true
  }, [])

  const logout = useCallback(async () => {
    await removeSecure(SECURE_KEYS.AUTH_TOKEN)
    await removeSecure(SECURE_KEYS.REFRESH_TOKEN)
    await removeSecure(SECURE_KEYS.USER_DATA)
    setUser(null)
  }, [])

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginOffline,
      logout,
      hasLocalPassword: hasLocalPw,
    }),
    [user, isLoading, hasLocalPw, login, loginOffline, logout]
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
