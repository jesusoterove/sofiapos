/**
 * IndexedDB query functions for sync state management.
 * Tracks last sync timestamp for each entity type.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export interface SyncState {
  entity_type: string
  last_sync_at: string // ISO timestamp
  store_id?: number
  updated_at: string
}

/**
 * Get the last sync timestamp for an entity type.
 * Falls back to registration timestamp if no stored timestamp exists.
 * @param db Database instance
 * @param entityType Entity type (e.g., 'products', 'categories')
 * @param storeId Optional store ID for store-specific entities
 * @returns Last sync timestamp, registration timestamp, or null if no registration exists
 */
export async function getLastSyncTimestamp(
  db: IDBPDatabase<POSDatabase>,
  entityType: string,
  storeId?: number
): Promise<string | null> {
  try {
    let storedTimestamp: string | null = null
    
    // For store-specific entities, we need to query by store_id index
    if (storeId) {
      const index = db.transaction('sync_state').store.index('by-store')
      const states = await index.getAll(storeId)
      const state = states.find((s) => s.entity_type === entityType)
      storedTimestamp = state?.last_sync_at || null
    } else {
      // For global entities, use entity_type as key
      const state = await db.get('sync_state', entityType)
      storedTimestamp = state?.last_sync_at || null
    }
    
    // If we have a stored timestamp, return it
    if (storedTimestamp) {
      return storedTimestamp
    }
    
    // Fall back to registration timestamp if no stored timestamp exists
    // This ensures we can sync updates even if incremental sync hasn't run yet
    try {
      const { getRegistration } = await import('../../utils/registration')
      const registration = getRegistration()
      if (registration?.registeredAt) {
        console.log(`[getLastSyncTimestamp] No stored timestamp for ${entityType}, using registration timestamp: ${registration.registeredAt}`)
        return registration.registeredAt
      }
    } catch (importError) {
      console.warn('[getLastSyncTimestamp] Could not import registration utility:', importError)
    }
    
    return null
  } catch (error) {
    console.error(`[getLastSyncTimestamp] Error getting sync state for ${entityType}:`, error)
    return null
  }
}

/**
 * Update the last sync timestamp for an entity type.
 * @param db Database instance
 * @param entityType Entity type (e.g., 'products', 'categories')
 * @param timestamp ISO timestamp of the sync
 * @param storeId Optional store ID for store-specific entities
 */
export async function updateLastSyncTimestamp(
  db: IDBPDatabase<POSDatabase>,
  entityType: string,
  timestamp: string,
  storeId?: number
): Promise<void> {
  try {
    // For store-specific entities, use composite key format
    // For global entities, use entity_type as key
    const key = storeId ? `${entityType}_store_${storeId}` : entityType
    const state: SyncState = {
      entity_type: key,
      last_sync_at: timestamp,
      store_id: storeId,
      updated_at: new Date().toISOString(),
    }
    await db.put('sync_state', state)
  } catch (error) {
    console.error(`[updateLastSyncTimestamp] Error updating sync state for ${entityType}:`, error)
    throw error
  }
}

/**
 * Get all sync states for a specific store.
 * @param db Database instance
 * @param storeId Store ID
 * @returns Array of sync states for the store
 */
export async function getStoreSyncStates(
  db: IDBPDatabase<POSDatabase>,
  storeId: number
): Promise<SyncState[]> {
  try {
    const index = db.transaction('sync_state').store.index('by-store')
    const states = await index.getAll(storeId)
    return states as SyncState[]
  } catch (error) {
    console.error(`[getStoreSyncStates] Error getting sync states for store ${storeId}:`, error)
    return []
  }
}

/**
 * Get all sync states (global and store-specific).
 * @param db Database instance
 * @returns Array of all sync states
 */
export async function getAllSyncStates(db: IDBPDatabase<POSDatabase>): Promise<SyncState[]> {
  try {
    const states = await db.getAll('sync_state')
    return states as SyncState[]
  } catch (error) {
    console.error('[getAllSyncStates] Error getting all sync states:', error)
    return []
  }
}

/**
 * Clear sync state for an entity type (useful for resetting sync).
 * @param db Database instance
 * @param entityType Entity type
 * @param storeId Optional store ID
 */
export async function clearSyncState(
  db: IDBPDatabase<POSDatabase>,
  entityType: string,
  storeId?: number
): Promise<void> {
  try {
    // For store-specific entities, use composite key format
    // For global entities, use entity_type as key
    const key = storeId ? `${entityType}_store_${storeId}` : entityType
    await db.delete('sync_state', key)
  } catch (error) {
    console.error(`[clearSyncState] Error clearing sync state for ${entityType}:`, error)
    throw error
  }
}

