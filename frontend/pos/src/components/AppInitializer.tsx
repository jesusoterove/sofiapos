/**
 * App initializer component that checks registration and redirects accordingly.
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { isRegistered } from '@/utils/registration'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, check if registered
        if (!isRegistered()) {
          navigate({ to: '/register', replace: true })
        } else {
          navigate({ to: '/login', replace: true })
        }
      } else {
        // Authenticated, check registration
        if (!isRegistered()) {
          navigate({ to: '/register', replace: true })
        } else {
          // Check shift status
          navigate({ to: '/check-shift', replace: true })
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate])

  return <>{children}</>
}

