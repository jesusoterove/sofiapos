/**
 * Inventory entry page - allows entering inventory entries for the current shift.
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { Card } from '@sofiapos/ui'
import { Button } from '@sofiapos/ui'
import { Input } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useShiftContext } from '@/contexts/ShiftContext'
import { openDatabase } from '@/db'
import { getAllInventoryControlConfig } from '@/db/queries/inventoryControlConfig'
import { getInventoryEntriesByShift } from '@/db/queries/inventory'
import { saveInventoryEntry, saveInventoryTransaction } from '@/db/queries/inventory'
import { updateShiftSummaryOnInventoryEntry } from '@/services/shiftSummary'
import { toast } from 'react-toastify'
import { getRegistration } from '@/utils/registration'

interface InventoryEntryRow {
  id: string
  item_name: string
  item_type: 'Product' | 'Material'
  product_id?: number
  material_id?: number
  uofm_id: number
  uofm_abbreviation: string
  quantity: number
}

export function InventoryEntryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentShift } = useShiftContext()
  const registration = getRegistration()
  const storeId = registration?.storeId || 1

  const [loading, setLoading] = useState(true)
  const [availableItems, setAvailableItems] = useState<InventoryEntryRow[]>([])
  const [existingEntries, setExistingEntries] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!currentShift) {
        toast.error(t('shift.noOpenShift') || 'No open shift found')
        navigate({ to: '/app', replace: true })
        return
      }

      try {
        setLoading(true)
        const db = await openDatabase()

        // Get inventory control config
        const config = await getAllInventoryControlConfig(db, true) // Only show_in_inventory=true

        // Build available items list
        const items: InventoryEntryRow[] = []
        config.forEach((item) => {
          const itemName = item.item_type === 'Product' ? item.product_name : item.material_name
          if (!itemName) return

          const itemId = item.item_type === 'Product' ? item.product_id! : item.material_id!

          // Add each UoM as a separate selectable item
          if (item.uofm1_id && item.uofm1_abbreviation) {
            items.push({
              id: `${item.id}-uofm1`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id || undefined,
              material_id: item.material_id || undefined,
              uofm_id: item.uofm1_id,
              uofm_abbreviation: item.uofm1_abbreviation,
              quantity: 0,
            })
          }
          if (item.uofm2_id && item.uofm2_abbreviation) {
            items.push({
              id: `${item.id}-uofm2`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id || undefined,
              material_id: item.material_id || undefined,
              uofm_id: item.uofm2_id,
              uofm_abbreviation: item.uofm2_abbreviation,
              quantity: 0,
            })
          }
          if (item.uofm3_id && item.uofm3_abbreviation) {
            items.push({
              id: `${item.id}-uofm3`,
              item_name: itemName,
              item_type: item.item_type,
              product_id: item.product_id || undefined,
              material_id: item.material_id || undefined,
              uofm_id: item.uofm3_id,
              uofm_abbreviation: item.uofm3_abbreviation,
              quantity: 0,
            })
          }
        })

        setAvailableItems(items)

        // Get existing entries for this shift
        const entries = await getInventoryEntriesByShift(db, currentShift.shift_number)
        setExistingEntries(entries)
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || t('common.error') || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentShift, navigate, t])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentShift) {
      toast.error(t('shift.noOpenShift') || 'No open shift found')
      return
    }

    if (!selectedItemId || !quantity || parseFloat(quantity) <= 0) {
      toast.error(t('inventory.enterValidQuantity') || 'Please enter a valid quantity')
      return
    }

    const selectedItem = availableItems.find((item) => item.id === selectedItemId)
    if (!selectedItem) {
      toast.error(t('inventory.selectItem') || 'Please select an item')
      return
    }

    try {
      const db = await openDatabase()
      const quantityValue = parseFloat(quantity)

      // Generate entry number (local)
      const entryNumber = `ENT-${Date.now()}`

      // Save inventory entry
      const entryId = await saveInventoryEntry(db, {
        store_id: storeId,
        entry_number: entryNumber,
        entry_type: 'purchase', // Use 'purchase' for shift refills
        entry_date: new Date().toISOString(),
        notes: notes || undefined,
        shift_id: typeof currentShift.id === 'number' && currentShift.id > 0 ? currentShift.id : undefined,
        shift_number: currentShift.shift_number,
      })

      // Save inventory transaction
      await saveInventoryTransaction(db, {
        entry_id: entryId,
        product_id: selectedItem.product_id,
        material_id: selectedItem.material_id,
        quantity: quantityValue,
        unit_of_measure_id: selectedItem.uofm_id,
      })

      // Update shift summary
      await updateShiftSummaryOnInventoryEntry(currentShift.shift_number, {
        item_id: selectedItem.item_type === 'Product' ? selectedItem.product_id! : selectedItem.material_id!,
        item_type: selectedItem.item_type,
        uofm_id: selectedItem.uofm_id,
        quantity: quantityValue,
      })

      toast.success(t('inventory.entrySaved') || 'Inventory entry saved successfully')

      // Reset form
      setSelectedItemId('')
      setQuantity('')
      setNotes('')

      // Reload existing entries
      const entries = await getInventoryEntriesByShift(db, currentShift.shift_number)
      setExistingEntries(entries)
    } catch (error: any) {
      console.error('Failed to save inventory entry:', error)
      toast.error(error.message || t('common.error') || 'Failed to save inventory entry')
    }
  }, [currentShift, selectedItemId, quantity, notes, availableItems, storeId, t])

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

  if (!currentShift) {
    return null
  }

  return (
    <POSLayout onHomeClick={handleBack}>
      <div className="p-2 flex flex-col overflow-hidden h-full">
        <div className="max-w-7xl mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.inventoryEntry') || 'Entrada de Inventario'} - {t('shift.shift') || 'Turno'} #{currentShift.shift_number}
            </h1>
          </div>

          {/* Two Sections: Existing Entries and Form */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 h-full">
            {/* Left: Existing Entries */}
            <Card padding="md" className="flex flex-col h-full overflow-hidden">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.existingEntries') || 'Entradas Existentes'}
              </h2>
              <div className="overflow-y-auto flex-1 min-h-0">
                {existingEntries.length === 0 ? (
                  <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('inventory.noEntries') || 'No entries yet'}
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse" style={{ borderColor: 'var(--color-border-default)' }}>
                    <thead
                      className="sticky top-0 z-20"
                      style={{
                        backgroundColor: 'var(--color-border-light)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <tr style={{ borderBottom: '2px solid var(--color-border-default)' }}>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('inventory.item') || 'Item'}
                        </th>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('inventory.quantity') || 'Cantidad'}
                        </th>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                          {t('inventory.date') || 'Fecha'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingEntries.map((entry) => (
                        <tr
                          key={entry.id}
                          style={{ borderBottom: '1px solid var(--color-border-default)' }}
                          className="hover:bg-gray-50"
                        >
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {entry.entry_number}
                          </td>
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {entry.entry_type}
                          </td>
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {new Date(entry.entry_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            {/* Right: New Entry Form */}
            <Card padding="md" className="flex flex-col h-full overflow-hidden">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.newEntry') || 'Nueva Entrada'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.item') || 'Item'}
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: 'var(--color-background-default)',
                    }}
                  >
                    <option value="">{t('inventory.selectItem') || 'Select an item...'}</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} ({item.uofm_abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  label={t('inventory.quantity') || 'Cantidad'}
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
                  step="0.01"
                  min="0"
                  fullWidth
                />
                <div className="w-full">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.notes') || 'Notas'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full p-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
                  <Button type="submit" variant="primary">
                    {t('inventory.saveEntry') || 'GUARDAR ENTRADA'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </POSLayout>
  )
}

