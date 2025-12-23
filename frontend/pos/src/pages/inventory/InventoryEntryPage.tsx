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
import { getInventoryEntriesByShift, getInventoryEntryDetailsByEntryNumber } from '@/db/queries/inventory'
import { saveInventoryEntry, saveInventoryEntryDetail } from '@/db/queries/inventory'
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
  unitCost: number // Pre-calculated unit cost in the selected UoM
}

// Decimal places constant for formatting numbers
const DECIMAL_PLACES = 2

export function InventoryEntryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentShift } = useShiftContext()
  const registration = getRegistration()
  const storeId = registration?.storeId || 1

  const [loading, setLoading] = useState(true)
  const [availableItems, setAvailableItems] = useState<InventoryEntryRow[]>([])
  const [existingEntries, setExistingEntries] = useState<Array<{
    entry: any
    detail: any
    itemName: string
    uofmAbbreviation: string
  }>>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [totalCost, setTotalCost] = useState('')
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

        // Load all data upfront to avoid multiple queries
        const [config, allMaterials, allMaterialUofms] = await Promise.all([
          getAllInventoryControlConfig(db, true), // Only show_in_inventory=true
          db.getAll('materials'),
          db.getAll('material_unit_of_measures'),
        ])

        // Build available items list with pre-calculated unit costs
        const items: InventoryEntryRow[] = []

        console.log('allMaterialUofms', allMaterialUofms)

        // Helper function to calculate unit cost for a UoM
        const calculateUnitCost = (baseUnitCost: number | undefined, item: any, uofmId: number): number => {
          if (baseUnitCost === undefined || baseUnitCost === 0) {
            return 0
          }

          console.log('Calculating unit cost for', item, 'baseUnitCost', baseUnitCost, 'uofmId', uofmId)

          if (item.item_type === 'Material' && item.material_id) {
            // Find material UoM conversion factor
            const materialUofms = allMaterialUofms.filter((muom) => muom.material_id === item.material_id)
            const baseUofm = materialUofms.find((muom) => muom.is_base_unit)

            console.log('baseUofm', baseUofm)
            
            // Check if selected UoM is the base unit
            if (baseUofm && baseUofm.unit_of_measure_id === uofmId) {
              return baseUnitCost // No conversion needed
            }
            
            // Find conversion factor for the selected UoM
            const matchingUofm = materialUofms.find((muom) => muom.unit_of_measure_id === uofmId)
            console.log('matchingUofm', matchingUofm)
            if (matchingUofm) {
              // conversion_factor converts FROM selected UoM TO base UoM
              // To convert cost FROM base TO selected: multiply by conversion_factor
              return baseUnitCost * matchingUofm.conversion_factor
            }
          } else if (item.item_type === 'Product' && item.product_id) {
            // Products don't have unit_cost, but we could add conversion factor logic here in the future
            return 0
          }
          
          return baseUnitCost // Fallback: use base unit cost
        }

        config.forEach((item) => {
          const itemName = item.item_type === 'Product' ? item.product_name : item.material_name
          if (!itemName) return

          // Get base unit cost (only for materials, products don't have unit_cost)
          let baseUnitCost: number | undefined
          if (item.item_type === 'Material' && item.material_id) {
            const material = allMaterials.find((m) => m.id === item.material_id)
            baseUnitCost = material?.unit_cost
          } else {
            baseUnitCost = 0 // Products don't have unit_cost
          }


          // Add each UoM as a separate selectable item with pre-calculated unit cost
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
              unitCost: calculateUnitCost(baseUnitCost, item, item.uofm1_id),
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
              unitCost: calculateUnitCost(baseUnitCost, item, item.uofm2_id),
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
              unitCost: calculateUnitCost(baseUnitCost, item, item.uofm3_id),
            })
          }
        })

        setAvailableItems(items)

        // Get existing entries for this shift with their details
        const entries = await getInventoryEntriesByShift(db, currentShift.shift_number)
        
        // Load all products, materials, and unit of measures for lookup
        const [allProducts, allMaterialsForLookup, allUnitOfMeasures] = await Promise.all([
          db.getAll('products'),
          db.getAll('materials'),
          db.getAll('unit_of_measures'),
        ])

        // Load entry details for each entry and build display data
        // Each detail becomes a separate row in the grid
        const entriesWithDetails: Array<{
          entry: any
          detail: any
          itemName: string
          uofmAbbreviation: string
        }> = []

        for (const entry of entries) {
          // Get entry details for this entry
          const details = await getInventoryEntryDetailsByEntryNumber(db, entry.entry_number)
          
          // Create a row for each detail
          for (const detail of details) {
            // Get item name
            let itemName = ''
            if (detail.product_id) {
              const product = allProducts.find((p) => p.id === detail.product_id)
              itemName = product?.name || `Product ${detail.product_id}`
            } else if (detail.material_id) {
              const material = allMaterialsForLookup.find((m) => m.id === detail.material_id)
              itemName = material?.name || `Material ${detail.material_id}`
            }

            // Get unit of measure abbreviation
            let uofmAbbreviation = ''
            if (detail.unit_of_measure_id) {
              const uofm = allUnitOfMeasures.find((u) => u.id === detail.unit_of_measure_id)
              uofmAbbreviation = uofm?.abbreviation || ''
            }

            entriesWithDetails.push({
              entry,
              detail,
              itemName,
              uofmAbbreviation,
            })
          }
        }

        setExistingEntries(entriesWithDetails)
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || t('common.error') || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentShift, navigate, t])

  // Update unit cost and total cost when item is selected
  useEffect(() => {
    if (!selectedItemId) {
      setUnitCost('')
      setTotalCost('')
      return
    }

    const selectedItem = availableItems.find((item) => item.id === selectedItemId)
    if (!selectedItem) {
      setUnitCost('')
      setTotalCost('')
      return
    }

    // Use pre-calculated unit cost from availableItems
    const preCalculatedUnitCost = selectedItem.unitCost
    
    if (preCalculatedUnitCost !== undefined && preCalculatedUnitCost > 0) {
      setUnitCost(preCalculatedUnitCost.toFixed(DECIMAL_PLACES))
      // Calculate total cost if quantity is set
      if (quantity && parseFloat(quantity) > 0) {
        setTotalCost((preCalculatedUnitCost * parseFloat(quantity)).toFixed(DECIMAL_PLACES))
      } else {
        setTotalCost('')
      }
    } else {
      setUnitCost('')
      setTotalCost('')
    }
  }, [selectedItemId, availableItems])

  // Auto-calculate total cost when unit cost or quantity changes
  useEffect(() => {
    if (unitCost && quantity && parseFloat(quantity) > 0) {
      const calculatedTotal = (parseFloat(unitCost) * parseFloat(quantity)).toFixed(DECIMAL_PLACES)
      setTotalCost(calculatedTotal)
    } else if (!unitCost || !quantity) {
      setTotalCost('')
    }
  }, [quantity])

  // Auto-calculate unit cost when total cost changes
  const handleTotalCostChange = (value: string) => {
    setTotalCost(value)
    if (value && quantity && parseFloat(quantity) > 0) {
      const calculatedUnitCost = (parseFloat(value) / parseFloat(quantity)).toFixed(DECIMAL_PLACES)
      setUnitCost(calculatedUnitCost)
    }
  }

  // Auto-calculate total cost when unit cost changes
  const handleUnitCostChange = (value: string) => {
    setUnitCost(value)
    if (value && quantity && parseFloat(quantity) > 0) {
      const calculatedTotal = (parseFloat(value) * parseFloat(quantity)).toFixed(DECIMAL_PLACES)
      setTotalCost(calculatedTotal)
    } else {
      setTotalCost('')
    }
  }

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
      const unitCostValue = unitCost ? parseFloat(unitCost) : undefined
      const totalCostValue = totalCost ? parseFloat(totalCost) : undefined

      // Save inventory entry (entry_number will be auto-generated)
      const entryNumber = await saveInventoryEntry(db, {
        store_id: storeId,
        entry_type: 'purchase', // Use 'purchase' for shift refills
        entry_date: new Date().toISOString(),
        notes: notes || undefined,
        shift_id: typeof currentShift.id === 'number' && currentShift.id > 0 ? currentShift.id : undefined,
        shift_number: currentShift.shift_number,
      })

      // Get the entry to verify it was created (entry_number is the return value)
      const entry = await db.get('inventory_entries', entryNumber)
      if (!entry) {
        throw new Error('Failed to retrieve created inventory entry')
      }

      // Save inventory entry detail
      await saveInventoryEntryDetail(db, {
        entry_number: entryNumber, // Local link using entry_number (primary key)
        entry_id: entry.id || 0, // Use id from entry (0 if unsynced)
        product_id: selectedItem.product_id,
        material_id: selectedItem.material_id,
        quantity: quantityValue,
        unit_of_measure_id: selectedItem.uofm_id,
        unit_cost: unitCostValue,
        total_cost: totalCostValue,
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
      setUnitCost('')
      setTotalCost('')
      setNotes('')

      // Reload existing entries with details
      const entries = await getInventoryEntriesByShift(db, currentShift.shift_number)
      
      // Load all products, materials, and unit of measures for lookup
      const [allProducts, allMaterialsForLookup, allUnitOfMeasures] = await Promise.all([
        db.getAll('products'),
        db.getAll('materials'),
        db.getAll('unit_of_measures'),
      ])

      // Load entry details for each entry and build display data
      // Each detail becomes a separate row in the grid
      const entriesWithDetails: Array<{
        entry: any
        detail: any
        itemName: string
        uofmAbbreviation: string
      }> = []

      for (const entry of entries) {
        // Get entry details for this entry
        const details = await getInventoryEntryDetailsByEntryNumber(db, entry.entry_number)
        
        // Create a row for each detail
        for (const detail of details) {
          // Get item name
          let itemName = ''
          if (detail.product_id) {
            const product = allProducts.find((p) => p.id === detail.product_id)
            itemName = product?.name || `Product ${detail.product_id}`
          } else if (detail.material_id) {
            const material = allMaterialsForLookup.find((m) => m.id === detail.material_id)
            itemName = material?.name || `Material ${detail.material_id}`
          }

          // Get unit of measure abbreviation
          let uofmAbbreviation = ''
          if (detail.unit_of_measure_id) {
            const uofm = allUnitOfMeasures.find((u) => u.id === detail.unit_of_measure_id)
            uofmAbbreviation = uofm?.abbreviation || ''
          }

          entriesWithDetails.push({
            entry,
            detail,
            itemName,
            uofmAbbreviation,
          })
        }
      }

      setExistingEntries(entriesWithDetails)
    } catch (error: any) {
      console.error('Failed to save inventory entry:', error)
      toast.error(error.message || t('common.error') || 'Failed to save inventory entry')
    }
  }, [currentShift, selectedItemId, quantity, unitCost, totalCost, notes, availableItems, storeId, t])

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
      <div className="p-2 flex flex-col overflow-hidden h-full w-full">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.inventoryEntry') || 'Entrada de Inventario'} - {t('shift.shift') || 'Turno'} #{currentShift.shift_number}
            </h1>
          </div>

          {/* Two Sections: Existing Entries and Form */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 h-full">
            {/* Left: Existing Entries */}
            <Card padding="md" className="flex flex-col h-full overflow-hidden col-span-2">
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
                      {existingEntries.map((entryData, index) => (
                        <tr
                          key={`${entryData.entry.id}-${entryData.detail.id}-${index}`}
                          style={{ borderBottom: '1px solid var(--color-border-default)' }}
                          className="hover:bg-gray-50"
                        >
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {entryData.itemName}
                          </td>
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {entryData.detail.quantity} {entryData.uofmAbbreviation}
                          </td>
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {new Date(entryData.entry.entry_date).toLocaleDateString()}
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
                <Input
                  type="number"
                  label={t('inventory.unitCost') || 'Costo Unitario'}
                  value={unitCost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitCostChange(e.target.value)}
                  step="0.0001"
                  min="0"
                  fullWidth
                />
                <Input
                  type="number"
                  label={t('inventory.totalCost') || 'Costo Total'}
                  value={totalCost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTotalCostChange(e.target.value)}
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

