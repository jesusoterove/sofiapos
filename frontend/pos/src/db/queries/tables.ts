/**
 * Database queries for tables.
 */
import { openDatabase, POSDatabase } from '../indexeddb'
import type { IDBPDatabase } from 'idb'
import type { Table } from '@/api/tables'
import { addToSyncQueue } from './sync'

// Re-export Table type for convenience
export type { Table }

/**
 * Save tables to IndexedDB.
 */
export async function saveTables(
  db: IDBPDatabase<POSDatabase>,
  tables: Table[]
): Promise<void> {
  const tx = db.transaction('tables', 'readwrite')
  await Promise.all(
    tables.map((table) =>
      tx.store.put({
        id: table.id,
        store_id: table.store_id,
        table_number: table.table_number,
        name: table.name,
        capacity: table.capacity,
        location: table.location,
        is_active: table.is_active,
        sync_status: 'synced' as const,
        created_at: table.created_at,
        updated_at: table.updated_at || null,
      })
    )
  )
  await tx.done
}

/**
 * Get tables from IndexedDB.
 */
export async function getTables(
  storeId?: number,
  activeOnly: boolean = true
): Promise<Table[]> {
  const db = await openDatabase()
  
  if (!db.objectStoreNames.contains('tables')) {
    return []
  }

  let tables: POSDatabase['tables']['value'][]

  if (storeId !== undefined) {
    const index = db.transaction('tables', 'readonly').store.index('by-store')
    tables = await index.getAll(storeId)
  } else {
    tables = await db.getAll('tables')
  }

  // Filter by active status if requested
  if (activeOnly) {
    tables = tables.filter((t) => t.is_active)
  }

  // Sort by table_number
  tables.sort((a, b) => {
    const numA = parseInt(a.table_number) || 0
    const numB = parseInt(b.table_number) || 0
    return numA - numB
  })

  // Transform to Table format
  return tables.map((t) => ({
    id: t.id,
    store_id: t.store_id,
    table_number: t.table_number,
    name: t.name,
    capacity: t.capacity,
    location: t.location,
    is_active: t.is_active,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }))
}

/**
 * Create a new table locally and add to sync queue.
 */
export async function createTable(
  tableData: {
    store_id: number
    table_number: string
    name?: string | null
    capacity?: number
    location?: string | null
    is_active?: boolean
  }
): Promise<Table> {
  const db = await openDatabase()
  
  // Generate a temporary ID (negative number to avoid conflicts with server IDs)
  const tempId = -Date.now()
  
  const now = new Date().toISOString()
  
  // Save table locally with pending sync status
  const tableRecord: POSDatabase['tables']['value'] = {
    id: tempId,
    store_id: tableData.store_id,
    table_number: tableData.table_number,
    name: tableData.name || null,
    capacity: tableData.capacity || 4,
    location: tableData.location || null,
    is_active: tableData.is_active !== undefined ? tableData.is_active : true,
    sync_status: 'pending',
    created_at: now,
    updated_at: null,
  }
  
  await db.put('tables', tableRecord)
  
  // Add to sync queue
  await addToSyncQueue(db, {
    type: 'table',
    action: 'create',
    data_id: tempId,
    data: tableRecord,
  })
  
  // Return in Table format
  return {
    id: tempId,
    store_id: tableData.store_id,
    table_number: tableData.table_number,
    name: tableData.name || null,
    capacity: tableData.capacity || 4,
    location: tableData.location || null,
    is_active: tableData.is_active !== undefined ? tableData.is_active : true,
    created_at: now,
    updated_at: null,
  }
}

