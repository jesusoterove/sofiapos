/**
 * Root route component.
 * Navigation logic is handled by beforeLoad hooks in the router configuration.
 * This component simply renders the child routes via Outlet.
 */
import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

export function RootRoute() {
  const { isLoading: authLoading } = useAuth()
  const { t } = useTranslation()

  // Show loading while auth context is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-default)]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">{t('common.loadingxxx') || 'Loading At...'}</p>
        </div>
      </div>
    )
  }
  // Render child routes
  return <Outlet />
}

