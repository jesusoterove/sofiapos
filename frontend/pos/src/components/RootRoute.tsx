/**
 * Root route component that handles initial routing based on registration and authentication status.
 */
import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { isRegistered } from '@/utils/registration'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

export function RootRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    const currentPath = location.pathname

    // Only handle initial routing for root path or if we're on an invalid path
    // Don't interfere with existing navigation to /login or /register
    if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
      // Let other routes handle their own navigation
      return
    }

    // Check registration status first
    const registered = isRegistered()

    // If on root path, determine where to go
    if (currentPath === '/') {
      if (!registered) {
        // Not registered - go to registration page
        navigate({ to: '/register', replace: true })
        return
      }

      if (!isAuthenticated) {
        // Registered but not authenticated - go to login
        navigate({ to: '/login', replace: true })
        return
      }

      // Registered and authenticated - let protected routes handle the rest
      // (will go to /check-shift via ProtectedRoute logic)
      return
    }

    // If on /login but already registered and authenticated, go to check-shift
    if (currentPath === '/login' && registered && isAuthenticated) {
      navigate({ to: '/check-shift', replace: true })
      return
    }

    // If on /register but already registered, go to login (if not authenticated) or check-shift (if authenticated)
    if (currentPath === '/register' && registered) {
      if (!isAuthenticated) {
        navigate({ to: '/login', replace: true })
      } else {
        navigate({ to: '/check-shift', replace: true })
      }
      return
    }
  }, [authLoading, isAuthenticated, location.pathname, navigate])

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-default)]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

