/**
 * Sync queue queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function addToSyncQueue(
  db: IDBPDatabase<POSDatabase>,
  item: Omit<POSDatabase['sync_queue']['value'], 'id' | 'retry_count' | 'created_at'>
) {
  return db.add('sync_queue', {
    ...item,
    retry_count: 0,
    created_at: new Date().toISOString(),
  } as POSDatabase['sync_queue']['value'])
}

export async function getSyncQueue(db: IDBPDatabase<POSDatabase>) {
  return db.getAll('sync_queue')
}

export async function removeFromSyncQueue(db: IDBPDatabase<POSDatabase>, id: number) {
  return db.delete('sync_queue', id)
}

export async function getSyncQueueCount(db: IDBPDatabase<POSDatabase>): Promise<number> {
  return db.count('sync_queue')
}

