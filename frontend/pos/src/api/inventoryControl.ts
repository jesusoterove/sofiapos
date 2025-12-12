/**
 * Inventory control configuration API client.
 */
import apiClient from './client'

export interface InventoryControlConfig {
  id: number
  item_type: 'Product' | 'Material'
  product_id?: number | null
  material_id?: number | null
  show_in_inventory: boolean
  priority: number
  uofm1_id?: number | null
  uofm2_id?: number | null
  uofm3_id?: number | null
  product_name?: string | null
  material_name?: string | null
  uofm1_abbreviation?: string | null
  uofm2_abbreviation?: string | null
  uofm3_abbreviation?: string | null
}

export interface ShiftInventoryEntry {
  product_id?: number | null
  material_id?: number | null
  uofm_id: number
  quantity: number
}

export interface ShiftCloseWithInventoryRequest {
  final_cash?: number
  notes?: string
  inventory_entries: ShiftInventoryEntry[]
}

/**
 * Get inventory control configuration for a store.
 */
export async function getInventoryControlConfig(storeId: number): Promise<InventoryControlConfig[]> {
  const response = await apiClient.get(`/api/v1/inventory-control/config`, {
    params: { store_id: storeId },
  })
  return response.data
}

