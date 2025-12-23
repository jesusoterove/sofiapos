/**
 * API client for incremental sync endpoints.
 */
import apiClient from './client'

export interface IncrementalUpdateResponse {
  id: number
  [key: string]: any
}

/**
 * Check which entity types have updates since a given timestamp.
 * @param since ISO timestamp
 * @param storeId Optional store ID for store-specific entities
 * @returns Dictionary of entity types and whether they have updates
 */
export async function checkForUpdates(
  since: string,
  storeId?: number
): Promise<Record<string, boolean>> {
  try {
    const params: Record<string, string | number> = { since }
    if (storeId) {
      params.store_id = storeId
    }
    const response = await apiClient.get('/api/v1/sync/check', { params })
    return response.data
  } catch (error: any) {
    console.error('[checkForUpdates] Error checking for updates:', error)
    throw error
  }
}

/**
 * Get incremental updates for a specific entity type.
 * @param entityType Entity type (e.g., 'products', 'categories')
 * @param since ISO timestamp
 * @param storeId Optional store ID for store-specific entities
 * @returns Array of updated records
 */
export async function getIncrementalUpdates(
  entityType: string,
  since: string,
  storeId?: number
): Promise<IncrementalUpdateResponse[]> {
  try {
    const params: Record<string, string | number> = {
      entity_type: entityType,
      since,
    }
    if (storeId) {
      params.store_id = storeId
    }
    const response = await apiClient.get('/api/v1/sync/incremental', { params })
    return response.data || []
  } catch (error: any) {
    console.error(`[getIncrementalUpdates] Error getting updates for ${entityType}:`, error)
    throw error
  }
}

