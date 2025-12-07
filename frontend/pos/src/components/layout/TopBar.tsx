/**
 * Top bar component for POS application.
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@sofiapos/ui'
import { FaSignOutAlt, FaBox, FaTimes } from 'react-icons/fa'

export function TopBar() {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login', replace: true })
  }

  const handleCloseShift = () => {
    // TODO: Implement close shift
    console.log('Close shift clicked')
  }

  const handleInventoryEntry = () => {
    // TODO: Navigate to inventory entry
    console.log('Inventory entry clicked')
  }

  return (
    <div
      className="h-15 flex items-center justify-between px-4 py-3"
      style={{
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        height: '60px',
      }}
    >
      {/* Left: App Details */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{t('topBar.appName') || 'SofiaPOS'}</span>
        <span className="text-xs opacity-75">{t('topBar.version') || 'v1.0.0'}</span>
      </div>

      {/* Center: User and Time */}
      <div className="flex items-center gap-6">
        <div className="text-sm">
          <span className="opacity-75">User: </span>
          <span>{user?.username || 'Unknown'}</span>
        </div>
        <div className="text-sm font-mono">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="h-9 px-4 text-sm"
          style={{
            backgroundColor: 'transparent',
            borderColor: '#6B7280',
            color: '#F9FAFB',
          }}
        >
          <FaSignOutAlt className="mr-2" />
          {t('auth.logout') || 'Logout'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleCloseShift}
          className="h-9 px-4 text-sm"
          style={{
            backgroundColor: 'transparent',
            borderColor: '#6B7280',
            color: '#F9FAFB',
          }}
        >
          {t('topBar.closeShift') || 'Close Shift'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleInventoryEntry}
          className="h-9 px-4 text-sm"
          style={{
            backgroundColor: 'transparent',
            borderColor: '#6B7280',
            color: '#F9FAFB',
          }}
        >
          <FaBox className="mr-2" />
          {t('topBar.inventoryEntry') || 'Inventory'}
        </Button>
      </div>
    </div>
  )
}

