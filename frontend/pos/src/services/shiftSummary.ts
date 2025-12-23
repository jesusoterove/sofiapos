/**
 * Shift summary service for maintaining running shift summary.
 */
import { openDatabase } from '../db'
import { getShiftSummary, saveShiftSummary } from '../db/queries/shiftSummaries'
import { getAllInventoryControlConfig } from '../db/queries/inventoryControlConfig'
import { getRecipeByProductId, getRecipeMaterials } from '../db/queries/recipes'
// Note: getAllInventoryEntries is not used in this file, but kept for potential future use

export interface InventorySummaryItem {
  item_id: number
  item_type: 'Product' | 'Material'
  item_name: string
  uofm_id: number
  uofm_abbreviation: string
  beg_balance: number
  refills: number[]
  material_usage?: number
  end_balance?: number
  diff?: number
}

export interface ShiftSummaryData {
  shift_number: string
  shift_id?: number
  opened_at: string
  closed_at?: string
  initial_cash: number
  final_cash?: number
  expected_cash: number
  difference?: number
  bank_transfer_balance: number
  inventory_summary: InventorySummaryItem[]
  updated_at: string
}

/**
 * Initialize shift summary when shift opens.
 */
export async function initializeShiftSummary(
  shiftNumber: string,
  shiftData: { opened_at: string; initial_cash: number },
  beginningBalances?: Array<{ item_id: number; item_type: 'Product' | 'Material'; uofm_id: number; quantity: number }>
): Promise<void> {
  const db = await openDatabase()

  console.log('[initializeShiftSummary] Initializing shift summary for shift:', shiftNumber)
  
  // Get inventory control config
  const inventoryConfig = await getAllInventoryControlConfig(db, true) // Only show_in_inventory=true
  
  // Build inventory summary from config
  const inventorySummary: InventorySummaryItem[] = []
  
  for (const config of inventoryConfig) {
    const itemName = config.item_type === 'Product' ? config.product_name : config.material_name
    if (!itemName) continue
    
    const itemId = config.item_type === 'Product' ? config.product_id! : config.material_id!
    
    // Get beginning balance for each UoM from provided beginningBalances or default to 0
    const uofms: Array<{ id: number; abbreviation: string }> = []
    if (config.uofm1_id && config.uofm1_abbreviation) {
      uofms.push({ id: config.uofm1_id, abbreviation: config.uofm1_abbreviation })
    }
    if (config.uofm2_id && config.uofm2_abbreviation) {
      uofms.push({ id: config.uofm2_id, abbreviation: config.uofm2_abbreviation })
    }
    if (config.uofm3_id && config.uofm3_abbreviation) {
      uofms.push({ id: config.uofm3_id, abbreviation: config.uofm3_abbreviation })
    }
    
    for (const uofm of uofms) {
      // Find beginning balance from provided data
      const begBalance = beginningBalances?.find(
        (b) => b.item_id === itemId && b.uofm_id === uofm.id
      )?.quantity || 0
      
      inventorySummary.push({
        item_id: itemId,
        item_type: config.item_type,
        item_name: itemName,
        uofm_id: uofm.id,
        uofm_abbreviation: uofm.abbreviation,
        beg_balance: begBalance,
        refills: [],
        material_usage: config.item_type === 'Material' ? 0 : undefined,
      })
    }
  }
  
  // Sort by priority (from config)
  inventorySummary.sort((a, b) => {
    const aConfig = inventoryConfig.find(
      (c) => (c.item_type === 'Product' ? c.product_id : c.material_id) === a.item_id
    )
    const bConfig = inventoryConfig.find(
      (c) => (c.item_type === 'Product' ? c.product_id : c.material_id) === b.item_id
    )
    return (aConfig?.priority || 0) - (bConfig?.priority || 0)
  })
  
  const summary: ShiftSummaryData = {
    shift_number: shiftNumber,
    opened_at: shiftData.opened_at,
    initial_cash: shiftData.initial_cash,
    expected_cash: shiftData.initial_cash,
    bank_transfer_balance: 0,
    inventory_summary: inventorySummary,
    updated_at: new Date().toISOString(),
  }
  
  console.log('[initializeShiftSummary] Saving shift summary:', {
    shift_number: summary.shift_number,
    inventory_items_count: summary.inventory_summary.length,
    initial_cash: summary.initial_cash,
  })
  
  await saveShiftSummary(db, summary)
  
  // Verify the summary was saved
  const savedSummary = await getShiftSummary(db, shiftNumber)
  if (!savedSummary) {
    throw new Error(`Failed to verify shift summary was saved for shift ${shiftNumber}`)
  }
  
  console.log('[initializeShiftSummary] Shift summary saved and verified successfully:', savedSummary.shift_number)
}

/**
 * Update shift summary when order is paid.
 */
export async function updateShiftSummaryOnPayment(
  shiftNumber: string,
  order: { total: number; items: Array<{ productId: number; quantity: number }> },
  paymentMethod: 'cash' | 'bank_transfer'
): Promise<void> {
  const db = await openDatabase()
  
  let summary = await getShiftSummary(db, shiftNumber)
  if (!summary) {
    // Safeguard: If summary doesn't exist, try to create it from shift data
    console.warn(`Shift summary not found for shift ${shiftNumber}, attempting to create it`)
    try {
      // Try to get shift data from IndexedDB
      const { getShiftByNumber } = await import('../db/queries/shifts')
      const shift = await getShiftByNumber(db, shiftNumber)
      if (shift && shift.status === 'open') {
        // Initialize summary with default values
        await initializeShiftSummary(shiftNumber, {
          opened_at: shift.opened_at,
          initial_cash: shift.initial_cash || 0,
        })
        summary = await getShiftSummary(db, shiftNumber)
        if (!summary) {
          console.error(`Failed to create shift summary for shift ${shiftNumber}`)
          return
        }
        console.log(`Created missing shift summary for shift ${shiftNumber}`)
      } else {
        console.error(`Shift ${shiftNumber} not found or not open, cannot create summary`)
        return
      }
    } catch (error) {
      console.error(`Failed to create shift summary for shift ${shiftNumber}:`, error)
      return
    }
  }
  
  // Update financial totals
  if (paymentMethod === 'cash') {
    summary.expected_cash += order.total
  } else if (paymentMethod === 'bank_transfer') {
    summary.bank_transfer_balance += order.total
  }
  
  // Calculate and update material usage
  for (const orderItem of order.items) {
    // Get product's active recipe
    const recipe = await getRecipeByProductId(db, orderItem.productId)
    if (!recipe) continue
    
    // Get recipe materials
    const recipeMaterials = await getRecipeMaterials(db, recipe.id)
    
    for (const recipeMaterial of recipeMaterials) {
      // Calculate material usage: (order_item.quantity / recipe.yield_quantity) * recipe_material.quantity
      const materialUsage = (orderItem.quantity / recipe.yield_quantity) * recipeMaterial.quantity
      
      // Find matching inventory summary entry (material_id + uofm_id)
      // Note: We need to convert to material's base UoM if recipe_material has a different UoM
      // For now, we'll use the recipe_material's unit_of_measure_id if available
      const targetUofmId = recipeMaterial.unit_of_measure_id || recipeMaterial.material_id // Fallback
      
      const inventoryEntry = summary.inventory_summary.find(
        (entry) => entry.item_type === 'Material' && entry.item_id === recipeMaterial.material_id && entry.uofm_id === targetUofmId
      )
      
      if (inventoryEntry) {
        // Increment material usage
        inventoryEntry.material_usage = (inventoryEntry.material_usage || 0) + materialUsage
      } else {
        // If exact match not found, try to find by material_id only and use first UoM
        const materialEntry = summary.inventory_summary.find(
          (entry) => entry.item_type === 'Material' && entry.item_id === recipeMaterial.material_id
        )
        if (materialEntry) {
          materialEntry.material_usage = (materialEntry.material_usage || 0) + materialUsage
        }
      }
    }
  }
  
  summary.updated_at = new Date().toISOString()
  await saveShiftSummary(db, summary)
}

/**
 * Update shift summary when inventory entry is added.
 */
export async function updateShiftSummaryOnInventoryEntry(
  shiftNumber: string,
  entry: { item_id: number; item_type: 'Product' | 'Material'; uofm_id: number; quantity: number }
): Promise<void> {
  const db = await openDatabase()
  
  const summary = await getShiftSummary(db, shiftNumber)
  if (!summary) {
    console.warn(`Shift summary not found for shift ${shiftNumber}`)
    return
  }
  
  // Find matching inventory summary entry
  const inventoryEntry = summary.inventory_summary.find(
    (e) => e.item_id === entry.item_id && e.item_type === entry.item_type && e.uofm_id === entry.uofm_id
  )
  
  if (inventoryEntry) {
    // Add refill quantity to refills array (up to 6 refills)
    if (inventoryEntry.refills.length < 6) {
      inventoryEntry.refills.push(entry.quantity)
    } else {
      // If already 6 refills, replace the last one or add to it
      inventoryEntry.refills[5] = (inventoryEntry.refills[5] || 0) + entry.quantity
    }
  }
  
  summary.updated_at = new Date().toISOString()
  await saveShiftSummary(db, summary)
}

/**
 * Finalize shift summary when shift closes.
 */
export async function updateShiftSummaryOnClose(
  shiftNumber: string,
  finalCash: number,
  endBalances: Array<{ item_id: number; item_type: 'Product' | 'Material'; uofm_id: number; quantity: number }>
): Promise<void> {
  const db = await openDatabase()
  
  const summary = await getShiftSummary(db, shiftNumber)
  if (!summary) {
    console.warn(`Shift summary not found for shift ${shiftNumber}`)
    return
  }
  
  // Set final cash and closed date
  summary.final_cash = finalCash
  summary.closed_at = new Date().toISOString()
  
  // Calculate difference
  summary.difference = summary.expected_cash - finalCash
  
  // Get all inventory entries for this shift to check if there were any entries during the shift
  const { getInventoryEntriesByShift } = await import('../db/queries/inventory')
  const { getInventoryEntryDetailsByEntryNumber } = await import('../db/queries/inventory')
  const inventoryEntries = await getInventoryEntriesByShift(db, shiftNumber)
  
  // Build a set of items that had inventory entries during the shift
  const itemsWithInventoryEntries = new Set<string>()
  for (const entry of inventoryEntries) {
    const details = await getInventoryEntryDetailsByEntryNumber(db, entry.entry_number)
    for (const detail of details) {
      const itemKey = `${detail.product_id || detail.material_id}-${detail.product_id ? 'Product' : 'Material'}-${detail.unit_of_measure_id}`
      itemsWithInventoryEntries.add(itemKey)
    }
  }
  
  // Update inventory summary with end balances and calculate differences
  for (const endBalance of endBalances) {
    const inventoryEntry = summary.inventory_summary.find(
      (e) => e.item_id === endBalance.item_id && e.item_type === endBalance.item_type && e.uofm_id === endBalance.uofm_id
    )
    
    if (inventoryEntry) {
      inventoryEntry.end_balance = endBalance.quantity
      
      // Calculate diff
      const refillsSum = inventoryEntry.refills.reduce((sum, r) => sum + r, 0)
      
      if (inventoryEntry.item_type === 'Material') {
        // For materials: diff = beg_balance + refills - material_usage - end_balance
        inventoryEntry.diff = inventoryEntry.beg_balance + refillsSum - (inventoryEntry.material_usage || 0) - endBalance.quantity
      } else {
        // For products: diff = beg_balance + refills - end_balance
        inventoryEntry.diff = inventoryEntry.beg_balance + refillsSum - endBalance.quantity
      }
    }
  }
  
  // Remove inventory summary entries with no activity
  // Criteria: beg_balance = 0, end_balance = 0 (or undefined), no refills, no material usage, AND no inventory entries during the shift
  summary.inventory_summary = summary.inventory_summary.filter((entry) => {
    const hasBegBalance = entry.beg_balance !== 0
    const hasEndBalance = entry.end_balance !== undefined && entry.end_balance !== 0
    const hasRefills = entry.refills.length > 0
    const hasMaterialUsage = entry.item_type === 'Material' && (entry.material_usage || 0) !== 0
    
    // Check if there were any inventory entries for this item during the shift
    const itemKey = `${entry.item_id}-${entry.item_type}-${entry.uofm_id}`
    const hasInventoryEntries = itemsWithInventoryEntries.has(itemKey)
    
    // Keep entry if it has any activity:
    // - Beginning balance > 0, OR
    // - End balance > 0, OR
    // - Has refills, OR
    // - Has material usage (for materials), OR
    // - Had inventory entries during the shift
    return hasBegBalance || hasEndBalance || hasRefills || hasMaterialUsage || hasInventoryEntries
  })
  
  console.log(`[updateShiftSummaryOnClose] Filtered inventory summary: ${summary.inventory_summary.length} entries with activity`)
  
  summary.updated_at = new Date().toISOString()
  await saveShiftSummary(db, summary)
}

/**
 * Get shift summary for display.
 */
export async function getShiftSummaryForDisplay(shiftNumber: string): Promise<ShiftSummaryData | null> {
  const db = await openDatabase()
  const summary = await getShiftSummary(db, shiftNumber)
  return summary || null
}

