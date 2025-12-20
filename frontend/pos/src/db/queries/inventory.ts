/**
 * Inventory queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'
import { addToSyncQueue } from './sync'
import { generateInventoryNumber } from '../../utils/documentNumbers'
import { getRegistration } from '../../utils/registration'

export async function saveInventoryEntry(
  db: IDBPDatabase<POSDatabase>,
  entry: Omit<POSDatabase['inventory_entries']['value'], 'id' | 'entry_number' | 'sync_status' | 'created_at' | 'updated_at'>
) {
  // Generate entry_number if not provided
  let entryNumber = entry.entry_number
  if (!entryNumber) {
    const registration = getRegistration()
    if (!registration?.cashRegisterId || !registration?.cashRegisterCode) {
      throw new Error('Cash register not registered. Cannot generate inventory entry number.')
    }
    entryNumber = await generateInventoryNumber(
      registration.cashRegisterId,
      registration.cashRegisterCode,
      registration.storeId
    )
  }

  // ALWAYS save locally first (for performance, even when online)
  const entryData: POSDatabase['inventory_entries']['value'] = {
    ...entry,
    entry_number: entryNumber,
    id: entry.id || Date.now(), // Use timestamp as ID if not provided
    sync_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const entryId = await db.put('inventory_entries', entryData)

  // Add to sync queue
  await addToSyncQueue(db, {
    type: 'inventory_entry',
    action: 'create',
    data_id: entryId,
    data: entryData,
  })

  return entryId
}

export async function saveInventoryEntryDetail(
  db: IDBPDatabase<POSDatabase>,
  detail: Omit<POSDatabase['inventory_entry_details']['value'], 'id' | 'sync_status'>
) {
  // ALWAYS save locally first (for performance, even when online)
  const detailData: POSDatabase['inventory_entry_details']['value'] = {
    ...detail,
    id: detail.id || Date.now(), // Use timestamp as ID if not provided
    sync_status: 'pending',
  }

  const detailId = await db.put('inventory_entry_details', detailData)

  // Add to sync queue
  await addToSyncQueue(db, {
    type: 'inventory_entry_detail',
    action: 'create',
    data_id: detailId,
    data: detailData,
  })

  return detailId
}

export async function getInventoryEntries(
  db: IDBPDatabase<POSDatabase>,
  storeId?: number
): Promise<POSDatabase['inventory_entries']['value'][]> {
  if (storeId) {
    return db.getAllFromIndex('inventory_entries', 'by-store', storeId)
  }
  return db.getAll('inventory_entries')
}

export async function getInventoryEntryDetails(
  db: IDBPDatabase<POSDatabase>,
  entryId: number
): Promise<POSDatabase['inventory_entry_details']['value'][]> {
  return db.getAllFromIndex('inventory_entry_details', 'by-entry', entryId)
}

export async function getInventoryEntryDetailsByEntryNumber(
  db: IDBPDatabase<POSDatabase>,
  entryNumber: string
): Promise<POSDatabase['inventory_entry_details']['value'][]> {
  try {
    const index = db.transaction('inventory_entry_details', 'readonly').store.index('by-entry-number')
    return index.getAll(entryNumber)
  } catch (error) {
    // Fallback: get all and filter
    const allDetails = await db.getAll('inventory_entry_details')
    return allDetails.filter((d) => d.entry_number === entryNumber)
  }
}

export async function getInventoryEntry(
  db: IDBPDatabase<POSDatabase>,
  id: number
): Promise<POSDatabase['inventory_entries']['value'] | undefined> {
  return db.get('inventory_entries', id)
}

export async function getAllInventoryEntries(
  db: IDBPDatabase<POSDatabase>
): Promise<POSDatabase['inventory_entries']['value'][]> {
  return db.getAll('inventory_entries')
}

export async function getInventoryEntriesByShift(
  db: IDBPDatabase<POSDatabase>,
  shiftNumber: string
): Promise<POSDatabase['inventory_entries']['value'][]> {
  try {
    const index = db.transaction('inventory_entries', 'readonly').store.index('by-shift-number')
    return index.getAll(shiftNumber)
  } catch (error) {
    // Fallback: get all and filter
    const allEntries = await db.getAll('inventory_entries')
    return allEntries.filter((e) => e.shift_number === shiftNumber)
  }
}

