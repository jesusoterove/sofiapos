import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBTable {
  id: number
  store_id: number
  table_number: string
  name?: string | null
  capacity: number
  location?: string | null
  is_active: number
  sync_status: string
  created_at: string
  updated_at?: string | null
}

export async function getAllTables(db: SQLiteDatabase, storeId: number): Promise<DBTable[]> {
  return db.getAllAsync<DBTable>(
    'SELECT * FROM tables_store WHERE store_id = ? AND is_active = 1 ORDER BY table_number',
    [storeId]
  )
}

export async function saveTables(db: SQLiteDatabase, tables: DBTable[]): Promise<void> {
  for (const t of tables) {
    await db.runAsync(
      `INSERT OR REPLACE INTO tables_store (id, store_id, table_number, name, capacity, location, is_active, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.store_id, t.table_number, t.name ?? null, t.capacity, t.location ?? null, t.is_active, t.sync_status, t.created_at, t.updated_at ?? null]
    )
  }
}
