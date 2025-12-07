/**
 * Protected route component that requires authentication.
 * Supports both online and offline authentication.
 * Also checks for registration status and sync completion.
 */
import { Navigate, Outlet, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSync } from '@/contexts/SyncContext'
import { SyncScreen } from '@/components/sync/SyncScreen'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { isRegistered } from '@/utils/registration'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isSyncComplete } = useSync()
  const { t } = useTranslation()
  const location = useLocation()

  // Only check sync if authenticated (SyncProvider is inside AuthProvider)
  const shouldCheckSync = isAuthenticated

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

  // Show sync screen if syncing or if sync failed (but allow access)
  // Only block if actively syncing and not complete
  const { isSyncing, syncError } = useSync()
  if (shouldCheckSync && isSyncing && !isSyncComplete && location.pathname !== '/register') {
    return (
      <SyncScreen>
        <Outlet />
      </SyncScreen>
    )
  }
  
  // If sync failed, show error but allow access (don't block the app)
  // The SyncScreen will show the error message
  if (shouldCheckSync && syncError && !isSyncComplete && location.pathname !== '/register') {
    return (
      <SyncScreen>
        <Outlet />
      </SyncScreen>
    )
  }

  return <Outlet />
}

