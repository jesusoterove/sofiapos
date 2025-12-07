/**
 * Check shift page - determines if shift is open or needs to be opened.
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShift } from '@/hooks/useShift'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

export function CheckShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentShift, hasOpenShift, isLoading } = useShift()

  useEffect(() => {
    if (!isLoading) {
      if (hasOpenShift) {
        // Shift is open, proceed to POS screen
        navigate({ to: '/', replace: true })
      } else {
        // No open shift, go to open shift page
        navigate({ to: '/open-shift', replace: true })
      }
    }
  }, [hasOpenShift, isLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading...'}</p>
      </div>
    </div>
  )
}

