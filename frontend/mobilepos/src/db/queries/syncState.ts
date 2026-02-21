import type { SQLiteDatabase } from 'expo-sqlite'

export async function getLastSyncTimestamp(
  db: SQLiteDatabase,
  entityType: string,
  storeId?: number
): Promise<string | null> {
  const row = await db.getFirstAsync<{ last_sync_at: string }>(
    storeId
      ? 'SELECT last_sync_at FROM sync_state WHERE entity_type = ? AND store_id = ?'
      : 'SELECT last_sync_at FROM sync_state WHERE entity_type = ?',
    storeId ? [entityType, storeId] : [entityType]
  )
  return row?.last_sync_at ?? null
}

export async function updateLastSyncTimestamp(
  db: SQLiteDatabase,
  entityType: string,
  timestamp: string,
  storeId?: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_state (entity_type, last_sync_at, store_id, updated_at)
     VALUES (?, ?, ?, ?)`,
    [entityType, timestamp, storeId ?? null, new Date().toISOString()]
  )
}
