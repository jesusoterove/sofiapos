/**
 * Protected route component that requires authentication.
 * Supports both online and offline authentication.
 * Also checks for registration status.
 */
import { Navigate, Outlet, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { isRegistered } from '@/utils/registration'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check registration status (except for registration route itself)
  if (!isRegistered() && location.pathname !== '/register') {
    return <Navigate to="/register" replace />
  }

  return <Outlet />
}

