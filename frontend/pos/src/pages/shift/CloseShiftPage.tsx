/**
 * Close Shift Page - for closing a shift with inventory end balances.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Card, AdvancedDataGrid, AdvancedDataGridColumn } from '@sofiapos/ui'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import { useShiftContext } from '@/contexts/ShiftContext'
import { getRegistration } from '@/utils/registration'
import { POSLayout } from '@/components/layout/POSLayout'

interface InventoryBalanceRow {
  id: string
  item_name: string
  item_type: 'Product' | 'Material'
  product_id?: number | null
  material_id?: number | null
  uofm_id: number
  uofm_abbreviation: string
  balance_final: number
}

export function CloseShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentShift, closeShift, fetchInventoryConfig, isLoading } = useShiftContext()
  const registration = getRegistration()
  const storeId = registration?.storeId || user?.store_id || 1

  const [receivedBy, setReceivedBy] = useState('')
  const [finalCash, setFinalCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [endBalanceRows, setEndBalanceRows] = useState<InventoryBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Guard: Prevent navigation if shift becomes null during loading
  useEffect(() => {
    if (!isLoading && !currentShift && !loading) {
      // Shift was closed or doesn't exist, but we're on CloseShiftPage
      // This shouldn't happen, but if it does, navigate back to POS
      console.warn('[CloseShiftPage] No shift found, navigating back to POS')
      navigate({ to: '/app', replace: true })
    }
  }, [currentShift, isLoading, loading, navigate])

  // Fetch data on mount
  useEffect(() => {
    if (!currentShift || !storeId) {
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const config = await fetchInventoryConfig(storeId)

        // Build end balance rows from config (no beginning balances needed)
        const rows: InventoryBalanceRow[] = []
        config.forEach((item) => {
          const itemName = item.item_type === 'Product' ? item.product_name : item.material_name
          if (!itemName) return

          // Create row for each UofM
          if (item.uofm1_id && item.uofm1_abbreviation) {
            rows.push({
              id: `${item.id}-uofm1`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id,
              material_id: item.material_id,
              uofm_id: item.uofm1_id,
              uofm_abbreviation: item.uofm1_abbreviation,
              balance_final: 0,
            })
          }

          if (item.uofm2_id && item.uofm2_abbreviation) {
            rows.push({
              id: `${item.id}-uofm2`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id,
              material_id: item.material_id,
              uofm_id: item.uofm2_id,
              uofm_abbreviation: item.uofm2_abbreviation,
              balance_final: 0,
            })
          }

          if (item.uofm3_id && item.uofm3_abbreviation) {
            rows.push({
              id: `${item.id}-uofm3`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id,
              material_id: item.material_id,
              uofm_id: item.uofm3_id,
              uofm_abbreviation: item.uofm3_abbreviation,
              balance_final: 0,
            })
          }
        })

        setEndBalanceRows(rows)
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || t('common.error') || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentShift, storeId, fetchInventoryConfig])

  // End Balance columns (editable) - tab navigation skips columns 1 and 2
  const endBalanceColumns: AdvancedDataGridColumn[] = useMemo(() => [
    {
      field: 'item_name',
      headerName: t('shift.ingredientProduct') || 'Ingredient / Product',
      width: 200,
      sortable: true,
      suppressKeyboardEvent: (params: any) => {
        // Skip tab navigation for this column
        return params.event.key === 'Tab'
      },
    },
    {
      field: 'uofm_abbreviation',
      headerName: t('shift.unitOfMeasure') || 'U.M.',
      width: 100,
      sortable: true,
      suppressKeyboardEvent: (params: any) => {
        // Skip tab navigation for this column
        return params.event.key === 'Tab'
      },
    },
    {
      field: 'balance_final',
      headerName: t('shift.balanceFinal') || 'Balance Final',
      width: 150,
      sortable: true,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        precision: 2,
      },
      cellRenderer: (params: any) => {
        const value = params.value
        return value !== undefined && value !== null ? value.toFixed(2) : ''
      },
    },
  ], [t])

  // Handle cell value changes in end balance grid
  const handleCellValueChanged = useCallback((event: any) => {
    if (event.colDef.field === 'balance_final') {
      const updatedRows = endBalanceRows.map((row) => {
        if (row.id === event.data.id) {
          return { ...row, balance_final: event.newValue || 0 }
        }
        return row
      })
      setEndBalanceRows(updatedRows)
    }
  }, [endBalanceRows])

  // Format date/time for display
  const formattedDateTime = useMemo(() => {
    const date = currentDateTime.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const time = currentDateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${date} ${time}`
  }, [currentDateTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentShift) {
      toast.error(t('shift.noOpenShift') || 'No open shift found')
      return
    }

    try {
      const inventoryEntries = endBalanceRows.map((row) => ({
        product_id: row.product_id,
        material_id: row.material_id,
        uofm_id: row.uofm_id,
        quantity: row.balance_final,
      }))

      await closeShift({
        final_cash: finalCash ? parseFloat(finalCash) : undefined,
        notes: closingNotes,
        inventory_entries: inventoryEntries,
      })

      toast.success(t('shift.closeShiftSuccess') || 'Shift closed successfully!')
      navigate({ to: '/app', replace: true })
    } catch (error: any) {
      toast.error(error.message || t('shift.closeShiftFailed') || 'Failed to close shift')
    }
  }

  const handleBack = () => {
    navigate({ to: '/app', replace: false })
  }

  if (loading) {
    return (
      <POSLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg">{t('common.loading') || 'Loading...'}</div>
          </div>
        </div>
      </POSLayout>
    )
  }

  return (
    <POSLayout onHomeClick={handleBack}>
      <div className="p-4 flex flex-col overflow-hidden h-full">
        <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div></div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {t('shift.closeShift') || 'Cerrar Turno'} - {t('shift.shiftDetails') || 'Detalle del Turno'} #{currentShift?.shift_number || ''}
              </h1>
              <div 
                className="text-lg font-mono" 
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {formattedDateTime}
              </div>
            </div>
            <div></div>
          </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Closing Information Section */}
          <Card padding="lg" className="flex-shrink-0">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {t('shift.closingInformation') || 'Información de Cierre'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('shift.receivedBy') || 'Recibido Por'}
                value={receivedBy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceivedBy(e.target.value)}
                fullWidth
              />
              <Input
                type="number"
                label={t('shift.finalCash') || 'Efectivo Final'}
                value={finalCash}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinalCash(e.target.value)}
                step="0.01"
                min="0"
                fullWidth
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('shift.closingNotes') || 'Notas de Cierre'}
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded-lg"
                style={{
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </Card>

          {/* Final Balances Section */}
          <Card padding="lg" className="flex flex-col flex-1 min-h-0">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {t('shift.finalBalances') || 'Balances Finales'}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('shift.enterEndBalance') || 'Ingrese el balance final de inventario. Este valor no será editable después de confirmar.'}
            </p>
            {/* End Balance Grid (Editable) - Full height, no scrolling */}
            <div className="flex-1 min-h-0">
              <AdvancedDataGrid
                rowData={endBalanceRows}
                columnDefs={endBalanceColumns}
                enableSorting={true}
                enableFiltering={false}
                enablePagination={false}
                height="100%"
                gridOptions={{
                  onCellValueChanged: handleCellValueChanged,
                  defaultColDef: {
                    editable: false,
                  },
                  editType: 'fullRow',
                  stopEditingWhenCellsLoseFocus: true,
                  tabToNextCell: (params: any) => {
                    // Custom tab navigation - skip columns 1 and 2, only focus on balance_final
                    const currentCol = params.previousCellPosition?.column
                    const currentRow = params.previousCellPosition?.rowIndex ?? 0
                    
                    if (currentCol) {
                      const colIndex = params.columnApi.getAllDisplayedColumns().indexOf(currentCol)
                      // If we're in column 0 or 1, jump to column 2 (balance_final)
                      if (colIndex < 2) {
                        const allColumns = params.columnApi.getAllDisplayedColumns()
                        const balanceFinalCol = allColumns.find((col: any) => col.getColId() === 'balance_final')
                        if (balanceFinalCol) {
                          return {
                            rowIndex: currentRow,
                            column: balanceFinalCol,
                            rowPinned: null,
                          }
                        }
                      }
                      // If we're in balance_final column, move to next row's balance_final
                      if (colIndex === 2) {
                        const allColumns = params.columnApi.getAllDisplayedColumns()
                        const balanceFinalCol = allColumns.find((col: any) => col.getColId() === 'balance_final')
                        const nextRow = currentRow + 1
                        const rowCount = params.api.getDisplayedRowCount()
                        if (nextRow < rowCount && balanceFinalCol) {
                          return {
                            rowIndex: nextRow,
                            column: balanceFinalCol,
                            rowPinned: null,
                          }
                        }
                      }
                    }
                    // Default behavior
                    return undefined
                  },
                }}
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 flex-shrink-0 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigate({ to: '/app', replace: false })
              }}
            >
              {t('common.cancel') || 'CANCELAR'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? (t('common.loading') || 'Loading...') : (t('shift.confirmAndClose') || 'CONFIRMAR Y CERRAR')}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </POSLayout>
  )
}

