/**
 * Inventory queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'
import { addToSyncQueue } from './sync'

export async function saveInventoryEntry(
  db: IDBPDatabase<POSDatabase>,
  entry: Omit<POSDatabase['inventory_entries']['value'], 'id' | 'sync_status' | 'created_at' | 'updated_at'>
) {
  // ALWAYS save locally first (for performance, even when online)
  const entryData: POSDatabase['inventory_entries']['value'] = {
    ...entry,
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

export async function saveInventoryTransaction(
  db: IDBPDatabase<POSDatabase>,
  transaction: Omit<POSDatabase['inventory_transactions']['value'], 'id' | 'sync_status'>
) {
  // ALWAYS save locally first (for performance, even when online)
  const transactionData: POSDatabase['inventory_transactions']['value'] = {
    ...transaction,
    id: transaction.id || Date.now(), // Use timestamp as ID if not provided
    sync_status: 'pending',
  }

  const transactionId = await db.put('inventory_transactions', transactionData)

  // Add to sync queue
  await addToSyncQueue(db, {
    type: 'inventory_transaction',
    action: 'create',
    data_id: transactionId,
    data: transactionData,
  })

  return transactionId
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

export async function getInventoryTransactions(
  db: IDBPDatabase<POSDatabase>,
  entryId: number
): Promise<POSDatabase['inventory_transactions']['value'][]> {
  return db.getAllFromIndex('inventory_transactions', 'by-entry', entryId)
}

export async function getInventoryEntry(
  db: IDBPDatabase<POSDatabase>,
  id: number
): Promise<POSDatabase['inventory_entries']['value'] | undefined> {
  return db.get('inventory_entries', id)
}

