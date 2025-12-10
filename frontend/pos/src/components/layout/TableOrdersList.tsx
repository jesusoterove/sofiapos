/**
 * Table orders list component for BottomBar.
 * Displays table order buttons and a floating panel for all busy tables.
 */
import { useState } from 'react'
import { Button, IconButton } from '@sofiapos/ui'
import { FaChevronRight } from 'react-icons/fa'
import { useTranslation } from '@/i18n/hooks'
import type { OrderLocation, OpenOrder } from '@/hooks/useOrderManagement'
import type { Table } from '@/db/queries/tables'

// Maximum number of table order buttons to display before showing arrow
const MAX_VISIBLE_ORDERS = 4

interface TableOrdersListProps {
  openOrders: OpenOrder[]
  currentLocation: OrderLocation
  switchToLocation: (location: OrderLocation) => Promise<void>
  tables: Table[]
  getTableName: (tableId: number) => string
}

export function TableOrdersList({
  openOrders,
  currentLocation,
  switchToLocation,
  tables,
  getTableName,
}: TableOrdersListProps) {
  const { t } = useTranslation()
  const [showFloatingPanel, setShowFloatingPanel] = useState(false)

  // Filter table orders
  const tableOrders = openOrders.filter(
    (order) => order.tableId !== undefined && order.tableId !== null
  )

  // Check if a table is active
  const isTableActive = (tableId: number) =>
    currentLocation !== 'cash_register' &&
    typeof currentLocation === 'object' &&
    currentLocation.tableId === tableId

  // Find the active table order
  const activeTableId = 
    currentLocation !== 'cash_register' &&
    typeof currentLocation === 'object'
      ? currentLocation.tableId
      : null

  const activeOrderIndex = activeTableId
    ? tableOrders.findIndex((order) => order.tableId === activeTableId)
    : -1

  // Get visible orders (limited to MAX_VISIBLE_ORDERS)
  // If active table is not in first MAX_VISIBLE_ORDERS, show it as the last visible button
  let visibleOrders: OpenOrder[]
  if (
    activeOrderIndex >= 0 &&
    activeOrderIndex >= MAX_VISIBLE_ORDERS &&
    tableOrders.length > MAX_VISIBLE_ORDERS
  ) {
    // Active table is beyond the visible range - show first (MAX-1) + active table
    const firstOrders = tableOrders.slice(0, MAX_VISIBLE_ORDERS - 1)
    const activeOrder = tableOrders[activeOrderIndex]
    visibleOrders = [...firstOrders, activeOrder]
  } else {
    // Active table is in first MAX_VISIBLE_ORDERS or no active table - show first MAX_VISIBLE_ORDERS
    visibleOrders = tableOrders.slice(0, MAX_VISIBLE_ORDERS)
  }

  const hasMoreOrders = tableOrders.length > MAX_VISIBLE_ORDERS

  // Get all busy tables (tables with orders)
  const busyTables = tableOrders.map((order) => {
    const table = tables.find((t) => t.id === order.tableId!)
    return {
      order,
      table,
      tableId: order.tableId!,
      tableName: getTableName(order.tableId!),
      itemCount: order.itemCount,
      total: order.total,
      active: isTableActive(order.tableId!),
    }
  })

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Visible Table Order Buttons (limited to MAX_VISIBLE_ORDERS) */}
        {visibleOrders.map((order) => {
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

        {/* Arrow Button to show floating panel when there are more orders */}
        {hasMoreOrders && (
          <IconButton
            variant="secondary"
            onClick={() => setShowFloatingPanel(true)}
            className="flex-shrink-0"
            size="sm"
            title={t('order.viewAllTables') || 'View all busy tables'}
            aria-label={t('order.viewAllTables') || 'View all busy tables'}
          >
            <FaChevronRight />
          </IconButton>
        )}
      </div>

      {/* Floating Panel for All Busy Tables */}
      {showFloatingPanel && (
        <FloatingTablePanel
          busyTables={busyTables}
          currentLocation={currentLocation}
          switchToLocation={switchToLocation}
          onClose={() => setShowFloatingPanel(false)}
        />
      )}
    </>
  )
}

interface FloatingTablePanelProps {
  busyTables: Array<{
    order: OpenOrder
    table: Table | undefined
    tableId: number
    tableName: string
    itemCount: number
    total: number
    active: boolean
  }>
  currentLocation: OrderLocation
  switchToLocation: (location: OrderLocation) => Promise<void>
  onClose: () => void
}

function FloatingTablePanel({
  busyTables,
  switchToLocation,
  onClose,
}: FloatingTablePanelProps) {
  const { t } = useTranslation()

  const handleTableClick = async (tableId: number) => {
    await switchToLocation({ type: 'table', tableId })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Floating Panel */}
      <div
        className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl border max-h-[60vh] overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
          borderColor: 'var(--color-border-default, #E5E7EB)',
          minWidth: '300px',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary, #111827)' }}
          >
            {t('order.busyTables') || 'Busy Tables'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-text-secondary, #6B7280)' }}
            aria-label={t('common.close') || 'Close'}
          >
            ×
          </button>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-2">
          {busyTables.length === 0 ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--color-text-secondary, #6B7280)' }}
            >
              {t('order.noBusyTables') || 'No busy tables'}
            </div>
          ) : (
            <div className="space-y-2">
              {busyTables.map(({ order, tableId, tableName, itemCount, total, active }) => (
                <button
                  key={order.id}
                  onClick={() => handleTableClick(tableId)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    active
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  style={{
                    backgroundColor: active
                      ? 'var(--color-primary-100, #DBEAFE)'
                      : 'var(--color-bg-default, #F9FAFB)',
                    borderColor: active
                      ? 'var(--color-primary-500, #3B82F6)'
                      : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="font-medium text-sm"
                        style={{ color: 'var(--color-text-primary, #111827)' }}
                      >
                        {tableName}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: 'var(--color-text-secondary, #6B7280)' }}
                      >
                        {itemCount} {itemCount === 1 ? (t('order.item') || 'item') : (t('order.items') || 'items')}
                      </div>
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-text-primary, #111827)' }}
                    >
                      ${total.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

