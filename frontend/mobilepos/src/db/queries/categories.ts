import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBCategory {
  id: number
  name: string
  description?: string | null
  sync_status: string
  updated_at: string
}

export async function getAllCategories(db: SQLiteDatabase): Promise<DBCategory[]> {
  return db.getAllAsync<DBCategory>('SELECT * FROM categories ORDER BY name')
}

export async function saveCategories(db: SQLiteDatabase, categories: DBCategory[]): Promise<void> {
  for (const c of categories) {
    await db.runAsync(
      `INSERT OR REPLACE INTO categories (id, name, description, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [c.id, c.name, c.description ?? null, c.sync_status, c.updated_at]
    )
  }
}
