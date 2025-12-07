/**
 * Bottom bar component for POS application.
 */
import React from 'react'
import { useTranslation } from '@/i18n/hooks'
import { useOffline } from '@/hooks/useOffline'
import { Badge } from '@sofiapos/ui'
import { FaCog } from 'react-icons/fa'

export function BottomBar() {
  const { t } = useTranslation()
  const { isOnline, pendingCount, syncNow } = useOffline()

  const handleSettings = () => {
    // TODO: Open settings
    console.log('Settings clicked')
  }

  return (
    <div
      className="h-12 flex items-center justify-between px-4"
      style={{
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        height: '50px',
      }}
    >
      {/* Left: Status Indicators */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="opacity-75">Shift: </span>
          <Badge variant="success" size="sm">
            {t('common.open') || 'Open'}
          </Badge>
        </div>
        <div>
          <span className="opacity-75">Cash: </span>
          <Badge variant="success" size="sm">
            {t('common.open') || 'Open'}
          </Badge>
        </div>
        <div>
          <span className="opacity-75">Sync: </span>
          <Badge variant={isOnline ? 'success' : 'danger'} size="sm">
            {isOnline ? t('sync.online') || 'Online' : t('sync.offline') || 'Offline'}
          </Badge>
          {pendingCount > 0 && (
            <span className="ml-1">({pendingCount})</span>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={syncNow}
            className="text-xs underline hover:opacity-75"
          >
            {t('sync.syncNow') || 'Sync Now'}
          </button>
        )}
      </div>

      {/* Right: Settings */}
      <button
        onClick={handleSettings}
        className="p-2 rounded hover:bg-gray-700 transition-colors"
        aria-label={t('settings.title') || 'Settings'}
      >
        <FaCog />
      </button>
    </div>
  )
}

