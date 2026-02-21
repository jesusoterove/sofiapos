import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBSyncQueueItem {
  id?: number
  type: string
  action: string
  data_id: string
  data: string
  retry_count: number
  created_at: string
}

export async function addToSyncQueue(db: SQLiteDatabase, item: Omit<DBSyncQueueItem, 'id'>): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO sync_queue (type, action, data_id, data, retry_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.type, item.action, item.data_id, item.data, item.retry_count, item.created_at]
  )
  return result.lastInsertRowId
}

export async function getSyncQueue(db: SQLiteDatabase): Promise<DBSyncQueueItem[]> {
  return db.getAllAsync<DBSyncQueueItem>('SELECT * FROM sync_queue ORDER BY id ASC')
}

export async function removeFromSyncQueue(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id])
}

export async function incrementRetryCount(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [id])
}

export async function getSyncQueueCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue')
  return row?.count ?? 0
}
