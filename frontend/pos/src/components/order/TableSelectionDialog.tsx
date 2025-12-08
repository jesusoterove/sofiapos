/**
 * Table selection dialog component.
 */
import { useState, useEffect } from 'react'
import { Modal, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { listTables, type Table } from '@/api/tables'

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
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTables()
    }
  }, [isOpen, storeId])

  const loadTables = async () => {
    setIsLoading(true)
    try {
      const tablesData = await listTables(storeId, true)
      setTables(tablesData)
    } catch (error) {
      console.error('Failed to load tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = () => {
    const selectedTable = selectedTableId
      ? tables.find((t) => t.id === selectedTableId) || null
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
            {/* Cash Register Option */}
            <button
              onClick={handleCashRegister}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
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

            {/* Tables List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {tables.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('order.noTablesAvailable') || 'No tables available'}
                </div>
              ) : (
                tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
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
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {table.name || `Table ${table.table_number}`}
                        </div>
                        <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {table.location && `${table.location} • `}
                          {t('order.capacity') || 'Capacity'}: {table.capacity}
                        </div>
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        #{table.table_number}
                      </div>
                    </div>
                  </button>
                ))
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

