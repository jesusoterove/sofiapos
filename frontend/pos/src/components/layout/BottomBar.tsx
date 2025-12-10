/**
 * Bottom bar component for POS application.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { useOffline } from '@/hooks/useOffline'
import { useOrderManagementContext } from '@/contexts/OrderManagementContext'
import { useSync } from '@/contexts/SyncContext'
import { Badge, Button, IconButton } from '@sofiapos/ui'
import { FaCog, FaExclamationTriangle } from 'react-icons/fa'
import { getTables, type Table } from '@/db/queries/tables'
import { SyncResultsModal } from '@/components/sync/SyncResultsModal'
import { getRegistration } from '@/utils/registration'
import { TableOrdersList } from './TableOrdersList'

export function BottomBar() {
  const { t } = useTranslation()
  const { isOnline, pendingCount, syncNow } = useOffline()
  // Use context instead of hook directly - this ensures state persists across remounts
  const { openOrders, currentLocation, switchToLocation, switchToCashRegister } = useOrderManagementContext()
  const { syncError, isFirstSync } = useSync()
  const [tables, setTables] = useState<Table[]>([])
  const [showSyncResults, setShowSyncResults] = useState(false)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      // Get store ID from registration
      const registration = getRegistration()
      const storeId = registration?.storeId || 1 // Fallback to 1 if not registered yet
      // Get tables from local IndexedDB (synced data) instead of API
      const tablesData = await getTables(storeId, true)
      setTables(tablesData)
    } catch (error) {
      console.error('Failed to load tables from IndexedDB:', error)
      // Fallback: set empty array if loading fails
      setTables([])
    }
  }

  const handleSettings = () => {
    // TODO: Open settings
    console.log('Settings clicked')
  }

  const getTableName = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId)
    return table ? (table.name || `Table ${table.table_number}`) : `Table ${tableId}`
  }

  const isCashRegisterActive = currentLocation === 'cash_register'

  // Show failed sync button only for background syncs (not first sync)
  const showFailedSyncButton = syncError && !isFirstSync

  return (
    <div
      className="h-16 flex items-center justify-between px-4"
      style={{
        backgroundColor: 'var(--color-bg-default)',
        color: 'var(--color-text-primary)',
        borderTop: '1px solid var(--color-border-default)',
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

      {/* Center: Orders Navigation */}
      <div className="flex items-center gap-2 flex-1 px-4">
        {/* Cash Register Button (Fixed) */}
        <Button
          variant={isCashRegisterActive ? 'primary' : 'secondary'}
          onClick={switchToCashRegister}
          className="whitespace-nowrap flex-shrink-0"
          size="sm"
        >
          {t('order.onCashRegister') || 'On Cash Register'}
        </Button>

        {/* Table Orders List Component */}
        <TableOrdersList
          openOrders={openOrders}
          currentLocation={currentLocation}
          switchToLocation={switchToLocation}
          tables={tables}
          getTableName={getTableName}
        />
      </div>

      {/* Right: Failed Sync Button & Settings */}
      <div className="flex items-center gap-2">
        {showFailedSyncButton && (
          <IconButton
            variant="danger"
            onClick={() => setShowSyncResults(true)}
            title={t('sync.viewResults') || 'View sync results'}
            className="p-2"
          >
            <FaExclamationTriangle />
          </IconButton>
        )}
        <button
          onClick={handleSettings}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          style={{ color: 'var(--color-text-primary)' }}
          aria-label={t('settings.title') || 'Settings'}
        >
          <FaCog />
        </button>
      </div>

      {/* Sync Results Modal */}
      <SyncResultsModal
        isOpen={showSyncResults}
        onClose={() => setShowSyncResults(false)}
      />
    </div>
  )
}

