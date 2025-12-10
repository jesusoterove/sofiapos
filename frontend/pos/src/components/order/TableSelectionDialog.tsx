/**
 * Table selection dialog component.
 */
import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { getTables, createTable, type Table } from '@/db/queries/tables'
import { getAllOrders } from '@/db/queries/orders'
import { openDatabase } from '@/db/indexeddb'

interface TableSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectTable: (table: Table | null) => void
  storeId: number
}

export function TableSelectionDialog({
  isOpen,
  onClose,
  onSelectTable,
  storeId,
}: TableSelectionDialogProps) {
  const { t } = useTranslation()
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [showNewTableForm, setShowNewTableForm] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('')
  const [newTableLocation, setNewTableLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTables()
    }
  }, [isOpen, storeId])

  const loadTables = async () => {
    setIsLoading(true)
    try {
      // Load tables from IndexedDB (offline-first)
      const tablesData = await getTables(storeId, true)

      // Load open orders to determine busy tables
      const db = await openDatabase()
      const draftOrders = await getAllOrders(db, 'draft')
      
      // Get table IDs that have active orders
      const busyTableIds = new Set(
        draftOrders
          .map(order => order.table_id)
          .filter((tableId): tableId is number => tableId !== null && tableId !== undefined)
      )

      // Filter out busy tables - show only non-busy tables
      const nonBusyTables = tablesData.filter(table => !busyTableIds.has(table.id))
      setAvailableTables(nonBusyTables)
    } catch (error) {
      console.error('Failed to load tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = async () => {
    if (!newTableNumber.trim()) {
      return
    }

    setIsCreating(true)
    try {
      const table = await createTable({
        store_id: storeId,
        table_number: newTableNumber.trim(),
        name: newTableName.trim() || null,
        capacity: parseInt(newTableCapacity) || 4,
        location: newTableLocation.trim() || null,
        is_active: true,
      })

      // Reload tables to show the new one
      await loadTables()
      
      // Reset form
      setNewTableNumber('')
      setNewTableName('')
      setNewTableCapacity('')
      setNewTableLocation('')
      setShowNewTableForm(false)
      
      // Auto-select the newly created table and close dialog
      setSelectedTableId(table.id)
      // Auto-select the table since it's newly created
      onSelectTable(table)
      onClose()
    } catch (error) {
      console.error('Failed to create table:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelect = () => {
    const selectedTable = selectedTableId
      ? availableTables.find((t) => t.id === selectedTableId) || null
      : null
    onSelectTable(selectedTable)
    onClose()
  }

  const handleCashRegister = () => {
    onSelectTable(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('order.selectTable') || 'Select Table'}
      size="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            {t('common.loading') || 'Loading...'}
          </div>
        ) : (
          <>
            {/* Cash Register and Add New Table - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Cash Register Option */}
              <button
                onClick={handleCashRegister}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedTableId === null
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-default hover:bg-gray-50'
                }`}
                style={{
                  borderColor:
                    selectedTableId === null
                      ? 'var(--color-primary-500)'
                      : 'var(--color-border-default)',
                  backgroundColor:
                    selectedTableId === null ? 'var(--color-primary-50)' : 'transparent',
                }}
              >
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {t('order.onCashRegister') || 'On Cash Register'}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('order.onCashRegisterDescription') || 'Default location for walk-in orders'}
                </div>
              </button>

              {/* New Table Button */}
              {!showNewTableForm && (
                <button
                  onClick={() => setShowNewTableForm(true)}
                  className="p-3 border-2 border-dashed rounded-lg text-center transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                >
                  + {t('order.addNewTable') || 'Add New Table'}
                </button>
              )}
              {showNewTableForm && <div></div>}
            </div>

            {/* New Table Form */}
            {showNewTableForm && (
              <div className="p-4 border-2 rounded-lg space-y-3" style={{ borderColor: 'var(--color-border-default)' }}>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {t('order.newTable') || 'New Table'}
                </div>
                <Input
                  label={t('order.tableNumber') || 'Table Number'}
                  value={newTableNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTableNumber(e.target.value)}
                  placeholder={t('order.tableNumberPlaceholder') || 'e.g., 1, 2, 3'}
                  required
                />
                <Input
                  label={t('order.tableName') || 'Table Name (Optional)'}
                  value={newTableName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTableName(e.target.value)}
                  placeholder={t('order.tableNamePlaceholder') || 'e.g., Window Table'}
                />
                <Input
                  label={t('order.capacity') || 'Capacity'}
                  type="number"
                  value={newTableCapacity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTableCapacity(e.target.value)}
                  placeholder="4"
                />
                <Input
                  label={t('order.location') || 'Location (Optional)'}
                  value={newTableLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTableLocation(e.target.value)}
                  placeholder={t('order.locationPlaceholder') || 'e.g., Front, Back'}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowNewTableForm(false)
                      setNewTableNumber('')
                      setNewTableName('')
                      setNewTableCapacity('')
                      setNewTableLocation('')
                    }}
                    className="flex-1"
                    disabled={isCreating}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateTable}
                    className="flex-1"
                    disabled={!newTableNumber.trim() || isCreating}
                  >
                    {isCreating ? (t('common.loading') || 'Loading...') : (t('common.add') || 'Add')}
                  </Button>
                </div>
              </div>
            )}

            {/* Tables List - 3 Column Grid */}
            <div className="max-h-96 overflow-y-auto">
              {availableTables.length === 0 && !showNewTableForm ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('order.noTablesAvailable') || 'No tables available'}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedTableId === table.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-default hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor:
                          selectedTableId === table.id
                            ? 'var(--color-primary-500)'
                            : 'var(--color-border-default)',
                        backgroundColor:
                          selectedTableId === table.id ? 'var(--color-primary-50)' : 'transparent',
                      }}
                    >
                      <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {table.name || `Table ${table.table_number}`}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {table.location && `${table.location} • `}
                        {t('order.capacity') || 'Cap'}: {table.capacity}
                      </div>
                      <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        #{table.table_number}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSelect}
                className="flex-1"
              >
                {t('common.confirm') || 'Confirm'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

