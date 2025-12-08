/**
 * Bottom bar component for POS application.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { useOffline } from '@/hooks/useOffline'
import { useOrders, type OrderLocation } from '@/hooks/useOrders'
import { useSync } from '@/contexts/SyncContext'
import { Badge, Button, IconButton } from '@sofiapos/ui'
import { FaCog, FaExclamationTriangle } from 'react-icons/fa'
import { listTables, type Table } from '@/api/tables'
import { SyncResultsModal } from '@/components/sync/SyncResultsModal'

const STORE_ID = 1 // TODO: Get from context/settings

export function BottomBar() {
  const { t } = useTranslation()
  const { isOnline, pendingCount, syncNow } = useOffline()
  const { openOrders, currentLocation, switchToLocation, switchToCashRegister } = useOrders(STORE_ID)
  const { syncError, isFirstSync } = useSync()
  const [tables, setTables] = useState<Table[]>([])
  const [showSyncResults, setShowSyncResults] = useState(false)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      const tablesData = await listTables(STORE_ID, true)
      setTables(tablesData)
    } catch (error) {
      console.error('Failed to load tables:', error)
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
  const isTableActive = (tableId: number) =>
    currentLocation !== 'cash_register' &&
    typeof currentLocation === 'object' &&
    currentLocation.tableId === tableId

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
      <div className="flex items-center gap-2 flex-1 overflow-x-auto px-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {/* Cash Register Button (Fixed) */}
        <Button
          variant={isCashRegisterActive ? 'primary' : 'secondary'}
          onClick={switchToCashRegister}
          className="whitespace-nowrap flex-shrink-0"
          size="sm"
        >
          {t('order.onCashRegister') || 'On Cash Register'}
        </Button>

        {/* Table Orders (Scrollable) */}
        {openOrders
          .filter((order) => order.tableId !== undefined && order.tableId !== null)
          .map((order) => {
            const tableId = order.tableId!
            const active = isTableActive(tableId)
            return (
              <Button
                key={order.id}
                variant={active ? 'primary' : 'secondary'}
                onClick={() => switchToLocation({ type: 'table', tableId })}
                className="whitespace-nowrap flex-shrink-0"
                size="sm"
              >
                {getTableName(tableId)} ({order.itemCount})
              </Button>
            )
          })}
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

