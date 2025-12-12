/**
 * Check shift page - determines if shift is open or needs to be opened.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShiftContext } from '@/contexts/ShiftContext'
import { Spinner } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

export function CheckShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasOpenShift, isLoading } = useShiftContext()
  const hasNavigatedRef = useRef(false)
  const navigationCountRef = useRef(0)

  useEffect(() => {
    // EMERGENCY STOP: Check if circuit breaker is disabled
    if (localStorage.getItem('pos_navigation_circuit_breaker') === 'disabled') {
      console.error('[CheckShiftPage] CIRCUIT BREAKER DISABLED - Navigation stopped')
      return
    }

    console.log('[CheckShiftPage] Effect triggered', {
      isLoading,
      hasOpenShift,
      navigationCount: navigationCountRef.current,
      timestamp: new Date().toISOString(),
    })

    // Circuit breaker: Stop if we've navigated too many times
    if (navigationCountRef.current >= 3) {
      console.error('[CheckShiftPage] CIRCUIT BREAKER: Too many navigations - stopping loop')
      localStorage.setItem('pos_navigation_circuit_breaker', 'disabled')
      return
    }

    if (hasNavigatedRef.current) {
      console.log('[CheckShiftPage] Already navigated in this effect, skipping')
      return
    }

    if (!isLoading) {
      // Check global navigation count
      const globalCount = parseInt(localStorage.getItem('pos_global_nav_count') || '0', 10)
      if (globalCount >= 15) {
        console.error('[CheckShiftPage] GLOBAL CIRCUIT BREAKER: Too many navigations - stopping')
        localStorage.setItem('pos_navigation_circuit_breaker', 'disabled')
        return
      }

      hasNavigatedRef.current = true
      navigationCountRef.current++
      const newGlobalCount = globalCount + 1
      localStorage.setItem('pos_global_nav_count', newGlobalCount.toString())
      
      const logs = JSON.parse(localStorage.getItem('pos_navigation_log') || '[]')
      
      if (hasOpenShift) {
        // Shift is open, proceed to POS screen
        console.log('[CheckShiftPage] Shift is open, navigating to /app')
        logs.push({
          timestamp: new Date().toISOString(),
          component: 'CheckShiftPage',
          from: '/app/check-shift',
          to: '/app',
          reason: `Shift is open`,
          state: { hasOpenShift, isLoading, globalCount: newGlobalCount }
        })
        navigate({ to: '/app', replace: true })
      } else {
        // No open shift, go to open shift page
        console.log('[CheckShiftPage] No open shift, navigating to /app/open-shift')
        logs.push({
          timestamp: new Date().toISOString(),
          component: 'CheckShiftPage',
          from: '/app/check-shift',
          to: '/app/open-shift',
          reason: `No open shift`,
          state: { hasOpenShift, isLoading, globalCount: newGlobalCount }
        })
        navigate({ to: '/app/open-shift', replace: true })
      }
      
      if (logs.length > 50) logs.shift()
      localStorage.setItem('pos_navigation_log', JSON.stringify(logs))
      
      // Reset flag after delay
      setTimeout(() => {
        hasNavigatedRef.current = false
      }, 1000)
    } else {
      console.log('[CheckShiftPage] Still loading shift, waiting...')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpenShift, isLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading...'}</p>
      </div>
    </div>
  )
}

