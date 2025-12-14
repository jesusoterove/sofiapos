/**
 * Shift database queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'
import { addToSyncQueue } from './sync'

export async function saveShift(
  db: IDBPDatabase<POSDatabase>,
  shift: Omit<POSDatabase['shifts']['value'], 'sync_status' | 'created_at' | 'updated_at'> & { sync_status?: 'synced' | 'pending' | 'error'; created_at?: string }
) {
  // Check if shifts store exists
  if (!db.objectStoreNames.contains('shifts')) {
    throw new Error('Shifts store not found. Please refresh the page to upgrade the database.')
  }

  if (!shift.shift_number) {
    throw new Error('shift_number is required to save shift')
  }

  // ALWAYS save locally first (for performance, even when online)
  const shiftData: POSDatabase['shifts']['value'] = {
    ...shift,
    shift_number: shift.shift_number, // PRIMARY KEY
    sync_status: shift.sync_status || 'pending',
    created_at: shift.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Use shift_number as key (primary key)
  await db.put('shifts', shiftData)

  // Add to sync queue only if not already synced
  if (shiftData.sync_status === 'pending') {
    await addToSyncQueue(db, {
      type: 'shift',
      action: 'create',
      data_id: shiftData.shift_number, // Use shift_number for local queue identification
      data: shiftData,
    })
  }

  return shiftData.shift_number
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
  shiftNumber: string
): Promise<POSDatabase['shifts']['value'] | undefined> {
  // Use shift_number as primary key
  return await db.get('shifts', shiftNumber)
}

export async function getShiftById(
  db: IDBPDatabase<POSDatabase>,
  shiftId: number
): Promise<POSDatabase['shifts']['value'] | null> {
  // Find shift by id (for remote sync operations)
  if (!db.objectStoreNames.contains('shifts')) {
    return null
  }
  
  try {
    const index = db.transaction('shifts', 'readonly').store.index('by-id')
    const shift = await index.get(shiftId)
    return shift || null
  } catch (error) {
    // Fallback: get all shifts and find by id
    const allShifts = await db.getAll('shifts')
    return allShifts.find(s => s.id === shiftId) || null
  }
}

export async function getShiftByNumber(
  db: IDBPDatabase<POSDatabase>,
  shiftNumber: string
): Promise<POSDatabase['shifts']['value'] | null> {
  // Check if shifts store exists
  if (!db.objectStoreNames.contains('shifts')) {
    return null
  }

  // shift_number is the primary key, so we can get directly
  try {
    const shift = await db.get('shifts', shiftNumber)
    return shift || null
  } catch (error) {
    console.error('Error getting shift by number:', error)
    return null
  }
}

export async function updateShift(
  db: IDBPDatabase<POSDatabase>,
  shift: POSDatabase['shifts']['value']
): Promise<void> {
  if (!shift.shift_number) {
    throw new Error('shift_number is required to update shift')
  }

  const updatedShift: POSDatabase['shifts']['value'] = {
    ...shift,
    shift_number: shift.shift_number, // PRIMARY KEY
    sync_status: shift.sync_status === 'synced' ? 'pending' : shift.sync_status,
    updated_at: new Date().toISOString(),
  }

  await db.put('shifts', updatedShift)

  // Add to sync queue if not already synced
  // Use shift_number for local queue identification, id for remote sync
  if (updatedShift.sync_status === 'pending') {
    await addToSyncQueue(db, {
      type: 'shift',
      action: 'update',
      data_id: updatedShift.shift_number, // Use shift_number for local queue
      data: updatedShift,
    })
  }
}

