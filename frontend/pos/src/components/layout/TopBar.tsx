/**
 * Top bar component for POS application.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useShiftContext } from '@/contexts/ShiftContext'
import { IconButton } from '@sofiapos/ui'
import { FaSignOutAlt, FaBox, FaClock, FaFileInvoice, FaHome } from 'react-icons/fa'
import { ChangeShiftModal } from '@/components/shift/ChangeShiftModal'
import { formatDateTime } from '@/utils/dateFormat'

interface TopBarProps {
  onSalesInvoicesClick?: () => void
  onHomeClick?: () => void
}

export function TopBar({ onSalesInvoicesClick, onHomeClick }: TopBarProps) {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { hasOpenShift, currentShift } = useShiftContext()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [showChangeShiftModal, setShowChangeShiftModal] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isWideScreen = windowWidth >= 1200

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login', replace: true })
  }

  const handleChangeShift = () => {
    // Show modal that handles both open and close based on current shift status
    setShowChangeShiftModal(true)
  }

  const handleInventoryEntry = () => {
    navigate({ to: '/app/inventory-entry', replace: false })
  }

  const handleSalesInvoices = () => {
    if (onSalesInvoicesClick) {
      onSalesInvoicesClick()
    } else {
      navigate({ to: '/app/sales-invoices', replace: false })
    }
  }

  const handleHome = () => {
    if (onHomeClick) {
      onHomeClick()
    } else {
      navigate({ to: '/app', replace: false })
    }
  }

  return (
    <div
      className="h-15 flex items-center justify-between px-4 py-3"
      style={{
        backgroundColor: 'var(--color-primary-800)',
        color: 'var(--color-primary-50)',
        height: '60px',
      }}
    >
      {/* Left: App Details */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{t('topBar.appName') || 'SofiaPOS'}</span>
        <span className="text-xs opacity-75">{t('topBar.version') || 'v1.0.0'}</span>
      </div>

      {/* Center: User, Shift Start Date, and Time */}
      <div className="flex items-center gap-6">
        <div className="text-sm">
          <span className="opacity-75">User: </span>
          <span>{user?.username || 'Unknown'}</span>
        </div>
        {currentShift && currentShift.opened_at && (
          <div className="text-sm">
            <span className="opacity-75">{t('topBar.shiftStart') || 'Shift Start: '}</span>
            <span>{formatDateTime(currentShift.opened_at)}</span>
          </div>
        )}
        <div className="text-sm font-mono">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <IconButton
          variant="secondary"
          onClick={handleHome}
          title={t('topBar.home') || 'Home'}
          className={`h-9 flex items-center justify-center ${isWideScreen ? 'px-3 gap-2' : 'w-9'}`}
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-50)',
          }}
          aria-label={t('topBar.home') || 'Home'}
        >
          <FaHome />
          {isWideScreen && <span className="text-sm">{t('topBar.home') || 'Home'}</span>}
        </IconButton>
        <IconButton
          variant="secondary"
          onClick={handleSalesInvoices}
          title={t('topBar.salesInvoices') || 'Sales Invoices'}
          className={`h-9 flex items-center justify-center ${isWideScreen ? 'px-3 gap-2' : 'w-9'}`}
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-50)',
          }}
          aria-label={t('topBar.salesInvoices') || 'Sales Invoices'}
        >
          <FaFileInvoice />
          {isWideScreen && <span className="text-sm">{t('topBar.salesInvoices') || 'Sales Invoices'}</span>}
        </IconButton>
        <IconButton
          variant="secondary"
          onClick={handleChangeShift}
          title={hasOpenShift ? (t('topBar.closeShift') || 'Close Shift') : (t('topBar.openShift') || 'Open Shift')}
          className={`h-9 flex items-center justify-center ${isWideScreen ? 'px-3 gap-2' : 'w-9'}`}
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-50)',
          }}
          aria-label={hasOpenShift ? (t('topBar.closeShift') || 'Close Shift') : (t('topBar.openShift') || 'Open Shift')}
        >
          <FaClock />
          {isWideScreen && <span className="text-sm">{hasOpenShift ? (t('topBar.closeShift') || 'Close Shift') : (t('topBar.openShift') || 'Open Shift')}</span>}
        </IconButton>
        <IconButton
          variant="secondary"
          onClick={handleInventoryEntry}
          title={t('topBar.inventoryEntry') || 'Inventory Entry'}
          className={`h-9 flex items-center justify-center ${isWideScreen ? 'px-3 gap-2' : 'w-9'}`}
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-50)',
          }}
          aria-label={t('topBar.inventoryEntry') || 'Inventory Entry'}
        >
          <FaBox />
          {isWideScreen && <span className="text-sm">{t('topBar.inventoryEntry') || 'Inventory Entry'}</span>}
        </IconButton>
        <IconButton
          variant="secondary"
          onClick={handleLogout}
          title={t('auth.logout') || 'Logout'}
          className={`h-9 flex items-center justify-center ${isWideScreen ? 'px-3 gap-2' : 'w-9'}`}
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--color-primary-600)',
            color: 'var(--color-primary-50)',
          }}
          aria-label={t('auth.logout') || 'Logout'}
        >
          <FaSignOutAlt />
          {isWideScreen && <span className="text-sm">{t('auth.logout') || 'Logout'}</span>}
        </IconButton>
      </div>

      {/* Change Shift Modal (handles both open and close) */}
      <ChangeShiftModal
        isOpen={showChangeShiftModal}
        onClose={() => setShowChangeShiftModal(false)}
      />
    </div>
  )
}

