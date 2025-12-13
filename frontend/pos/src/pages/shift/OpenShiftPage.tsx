/**
 * Open shift page for starting a new shift with inventory beginning balances.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Card } from '@sofiapos/ui'
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
  balance_beginning: number
  rowNum: number
  rowCount: number
}

export function OpenShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/app/open-shift' })
  const { user } = useAuth()
  const { openShift, fetchInventoryConfig, isLoading } = useShiftContext()
  const registration = getRegistration()
  const storeId = registration?.storeId || user?.store_id || 1

  const [initialCash, setInitialCash] = useState((search as { initialCash?: string })?.initialCash || '')
  const [openingNotes, setOpeningNotes] = useState('')
  const [beginningBalanceRows, setBeginningBalanceRows] = useState<InventoryBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Sync initialCash from search params when they change
  useEffect(() => {
    const searchInitialCash = (search as { initialCash?: string })?.initialCash
    // Update state if search param exists and is different from current state
    if (searchInitialCash !== undefined) {
      setInitialCash(searchInitialCash)
    }
  }, [search])

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    if (!storeId) {
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const config = await fetchInventoryConfig(storeId)

        // Build beginning balance rows from config
        const rows: InventoryBalanceRow[] = []
        config.forEach((item) => {
          const itemName = item.item_type === 'Product' ? item.product_name : item.material_name
          if (!itemName) return

          // Count how many UofMs this item has
          const uofmList: Array<{ id: number; abbreviation: string }> = []
          if (item.uofm1_id && item.uofm1_abbreviation) {
            uofmList.push({ id: item.uofm1_id, abbreviation: item.uofm1_abbreviation })
          }
          if (item.uofm2_id && item.uofm2_abbreviation) {
            uofmList.push({ id: item.uofm2_id, abbreviation: item.uofm2_abbreviation })
          }
          if (item.uofm3_id && item.uofm3_abbreviation) {
            uofmList.push({ id: item.uofm3_id, abbreviation: item.uofm3_abbreviation })
          }

          const rowCount = uofmList.length

          // Create row for each UofM with rowNum and rowCount
          uofmList.forEach((uofm, index) => {
            rows.push({
              id: `${item.id}-uofm${index + 1}`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id,
              material_id: item.material_id,
              uofm_id: uofm.id,
              uofm_abbreviation: uofm.abbreviation,
              balance_beginning: 0,
              rowNum: index + 1,
              rowCount: rowCount,
            })
          })
        })

        setBeginningBalanceRows(rows)
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || t('common.error') || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [storeId, fetchInventoryConfig, t])

  // Handle balance beginning value changes
  const handleBalanceChange = useCallback((rowId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const updatedRows = beginningBalanceRows.map((row) => {
      if (row.id === rowId) {
        return { ...row, balance_beginning: numValue }
      }
      return row
    })
    setBeginningBalanceRows(updatedRows)
  }, [beginningBalanceRows])

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

    if (!initialCash || parseFloat(initialCash) < 0) {
      toast.error(t('shift.enterValidInitialCash') || 'Please enter a valid initial cash amount')
      return
    }

    try {
      // For now, we'll just open the shift without inventory entries
      // Inventory entries can be added later if needed
      await openShift({
        initialCash: parseFloat(initialCash),
        inventoryBalance: undefined, // Can be calculated from beginning balances if needed
      })

      toast.success(t('shift.openShiftSuccess') || 'Shift opened successfully!')
      navigate({ to: '/app', replace: true })
    } catch (error: any) {
      toast.error(error.message || t('shift.openShiftFailed') || 'Failed to open shift')
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
      <div className="p-2 flex flex-col overflow-hidden h-full">
        <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {t('shift.openShift') || 'Abrir Turno'}
              </h1>
            </div>
            <div></div>
            <div>
              <div 
                className="text-lg font-mono" 
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {formattedDateTime}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 h-full">
              {/* Left Column: Beginning Balances Grid */}
              <Card padding="md" className="flex flex-col h-full overflow-hidden">
                <h2 className="text-xl font-semibold mb-1 flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                  {t('shift.beginningBalances') || 'Balances Iniciales'}
                </h2>
                <p className="text-sm mb-1 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('shift.enterBeginningBalance') || 'Ingrese el balance inicial de inventario.'}
                </p>
                {/* Beginning Balance Table (Editable) - Static header with scrollable body */}
                <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
                  <table className="w-full text-sm border-collapse" style={{ borderColor: 'var(--color-border-default)' }}>
                    <thead 
                      className="sticky top-0 z-20" 
                      style={{ 
                        backgroundColor: 'var(--color-border-light)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <tr style={{ borderBottom: '2px solid var(--color-border-default)' }}>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('shift.ingredientProduct') || 'Ingredient / Product'}
                        </th>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('shift.unitOfMeasure') || 'U.M.'}
                        </th>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('shift.balanceBeginning') || 'Balance Inicial'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {beginningBalanceRows.map((row) => (
                        <tr 
                          key={row.id}
                          style={{ borderBottom: '1px solid var(--color-border-default)' }}
                          className="hover:bg-gray-50"
                        >
                          {row.rowNum === 1 && (
                            <td 
                              className="py-0.5 px-3" 
                              style={{ color: 'var(--color-text-primary)' }}
                              rowSpan={row.rowCount}
                            >
                              {row.item_name}
                            </td>
                          )}
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {row.uofm_abbreviation}
                          </td>
                          <td className="py-0.5 px-3">
                            <input
                              type="number"
                              value={row.balance_beginning || ''}
                              onChange={(e) => handleBalanceChange(row.id, e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{
                                borderColor: 'var(--color-border-default)',
                                color: 'var(--color-text-primary)',
                                backgroundColor: 'var(--color-background-default)',
                              }}
                              onKeyDown={(e) => {
                                // Tab navigation: skip to next row's balance_beginning input
                                if (e.key === 'Tab' && !e.shiftKey) {
                                  e.preventDefault()
                                  const currentIndex = beginningBalanceRows.findIndex(r => r.id === row.id)
                                  const nextIndex = currentIndex + 1
                                  if (nextIndex < beginningBalanceRows.length) {
                                    const nextInput = document.querySelector(
                                      `input[data-row-id="${beginningBalanceRows[nextIndex].id}"]`
                                    ) as HTMLInputElement
                                    nextInput?.focus()
                                  }
                                }
                              }}
                              data-row-id={row.id}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Right Column: Opening Information */}
              <Card padding="md" className="flex flex-col h-full overflow-hidden">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  {t('shift.openingInformation') || 'Información de Apertura'}
                </h2>
                <div className="space-y-4 flex-1 flex flex-col">
                  <Input
                    type="number"
                    label={t('shift.initialCash') || 'Efectivo Inicial'}
                    value={initialCash}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialCash(e.target.value)}
                    step="0.01"
                    min="0"
                    fullWidth
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {t('shift.openingNotes') || 'Notas de Apertura'}
                    </label>
                    <textarea
                      value={openingNotes}
                      onChange={(e) => setOpeningNotes(e.target.value)}
                      rows={6}
                      className="w-full p-2 border rounded-lg"
                      style={{
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBack}
                    >
                      {t('common.cancel') || 'CANCELAR'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || !initialCash}
                    >
                      {isLoading ? (t('common.loading') || 'Loading...') : (t('shift.confirmAndOpen') || 'CONFIRMAR Y ABRIR')}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </POSLayout>
  )
}
