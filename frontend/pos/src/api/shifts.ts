/**
 * Shifts API client.
 */
import apiClient from './client'
import type { ShiftInventoryEntry, ShiftCloseWithInventoryRequest } from './inventoryControl'

export interface Shift {
  id: number
  store_id: number
  shift_number: string
  status: 'open' | 'closed'
  opened_by_user_id?: number
  closed_by_user_id?: number
  opened_at: string
  closed_at?: string
  notes?: string
}

export interface ShiftInventoryEntryResponse {
  rec_id: number
  shift_id: number
  entry_type: 'beg_bal' | 'refill' | 'end_bal'
  product_id?: number | null
  material_id?: number | null
  uofm_id: number
  quantity: number
  created_dt: string
  product_name?: string | null
  material_name?: string | null
  uofm_abbreviation?: string | null
}

/**
 * Get open shift for a cash register.
 */
export async function getOpenShift(cashRegisterId: number): Promise<Shift | null> {
  const response = await apiClient.get(`/api/v1/shifts/open`, {
    params: { cash_register_id: cashRegisterId },
  })
  return response.data
}

/**
 * Open a new shift.
 */
export async function openShift(storeId: number, initialCash: number, inventoryBalance?: number): Promise<Shift> {
  const response = await apiClient.post(`/api/v1/shifts/open`, {
    store_id: storeId,
    initial_cash: initialCash,
    inventory_balance: inventoryBalance,
  })
  return response.data
}

/**
 * Close a shift with inventory entries.
 */
export async function closeShiftWithInventory(
  shiftId: number,
  closeData: ShiftCloseWithInventoryRequest
): Promise<Shift> {
  const response = await apiClient.post(`/api/v1/shifts/${shiftId}/close-with-inventory`, closeData)
  return response.data
}

/**
 * Get inventory entries for a shift.
 */
export async function getShiftInventory(
  shiftId: number,
  entryType?: 'beg_bal' | 'refill' | 'end_bal'
): Promise<ShiftInventoryEntryResponse[]> {
  const params: any = {}
  if (entryType) {
    params.entry_type = entryType
  }
  const response = await apiClient.get(`/api/v1/shifts/${shiftId}/inventory`, { params })
  return response.data
}

