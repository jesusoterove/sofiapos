/**
 * Root route component that handles initial routing based on registration and authentication status.
 * 
 * Flow:
 * 1. Check if cash register is registered
 *    a. If yes → continue to step 2
 *    b. If no → go to registration
 * 2. Check if user is logged in
 *    a. If yes and not registered (edge case) → close session → registration
 *    b. If yes → go to home (/)
 *    c. If no → go to login
 */
import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { isRegistered, getRegistrationProgress } from '@/utils/registration'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

export function RootRoute() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    const currentPath = location.pathname

    // Don't interfere with routes that are already being navigated to
    if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
      return
    }

    // Step 1: Check if cash register is registered
    const registered = isRegistered()
    const progress = getRegistrationProgress()

    // If registration is incomplete and at sync step or later, continue registration
    if (!registered && progress && (progress.currentStep === 'sync' || progress.currentStep === 'createUser' || progress.currentStep === 'success')) {
      if (currentPath !== '/register') {
        navigate({ to: '/register', replace: true })
      }
      return
    }

    if (!registered) {
      // Not registered - go to registration
      if (currentPath !== '/register') {
        navigate({ to: '/register', replace: true })
      }
      return
    }

    // Step 2: Check if user is logged in
    if (isAuthenticated) {
      // Edge case: Authenticated but not registered (shouldn't happen, but handle it)
      if (!registered) {
        // Close session and go to registration
        logout()
        navigate({ to: '/register', replace: true })
        return
      }

      // Authenticated and registered - go to home
      if (currentPath === '/login' || currentPath === '/register') {
        navigate({ to: '/', replace: true })
      }
      return
    }

    // Not authenticated - go to login
    if (currentPath !== '/login' && currentPath !== '/register') {
      navigate({ to: '/login', replace: true })
    }
  }, [authLoading, isAuthenticated, location.pathname, navigate, logout])

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

