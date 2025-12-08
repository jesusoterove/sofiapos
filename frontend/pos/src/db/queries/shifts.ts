/**
 * Shift database queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'
import { addToSyncQueue } from './sync'

export async function saveShift(
  db: IDBPDatabase<POSDatabase>,
  shift: Omit<POSDatabase['shifts']['value'], 'sync_status' | 'created_at' | 'updated_at'> & { sync_status?: 'synced' | 'pending' | 'error' }
) {
  // Check if shifts store exists
  if (!db.objectStoreNames.contains('shifts')) {
    throw new Error('Shifts store not found. Please refresh the page to upgrade the database.')
  }

  // ALWAYS save locally first (for performance, even when online)
  const shiftData: POSDatabase['shifts']['value'] = {
    ...shift,
    sync_status: shift.sync_status || 'pending',
    created_at: shift.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const shiftId = await db.put('shifts', shiftData)

  // Add to sync queue only if not already synced
  if (shiftData.sync_status === 'pending') {
    await addToSyncQueue(db, {
      type: 'shift',
      action: 'create',
      data_id: shiftId,
      data: shiftData,
    })
  }

  return shiftId
}

export async function getOpenShift(
  db: IDBPDatabase<POSDatabase>,
  storeId: number
): Promise<POSDatabase['shifts']['value'] | null> {
  // Check if shifts store exists
  if (!db.objectStoreNames.contains('shifts')) {
    return null
  }

  try {
    const index = db.transaction('shifts', 'readonly').store.index('by-status')
    const shifts = await index.getAll('open')
    
    // Find shift for this store
    const storeShift = shifts.find(s => s.store_id === storeId)
    return storeShift || null
  } catch (error) {
    console.error('Error getting open shift:', error)
    return null
  }
}

export async function getShift(
  db: IDBPDatabase<POSDatabase>,
  shiftId: number | string
): Promise<POSDatabase['shifts']['value'] | undefined> {
  return await db.get('shifts', shiftId)
}

export async function updateShift(
  db: IDBPDatabase<POSDatabase>,
  shift: POSDatabase['shifts']['value']
): Promise<void> {
  const updatedShift: POSDatabase['shifts']['value'] = {
    ...shift,
    sync_status: shift.sync_status === 'synced' ? 'pending' : shift.sync_status,
    updated_at: new Date().toISOString(),
  }

  await db.put('shifts', updatedShift)

  // Add to sync queue if not already synced
  if (updatedShift.sync_status === 'pending') {
    await addToSyncQueue(db, {
      type: 'shift',
      action: 'update',
      data_id: updatedShift.id,
      data: updatedShift,
    })
  }
}

