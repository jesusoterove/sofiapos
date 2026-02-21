import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBShift {
  shift_number: string
  id: number
  store_id: number
  status: string
  opened_at: string
  closed_at?: string | null
  opened_by_user_id?: number | null
  closed_by_user_id?: number | null
  initial_cash?: number | null
  inventory_balance?: number | null
  notes?: string | null
  sync_status: string
  created_at: string
  updated_at: string
}

export async function getOpenShift(db: SQLiteDatabase, storeId: number): Promise<DBShift | null> {
  return db.getFirstAsync<DBShift>(
    'SELECT * FROM shifts WHERE store_id = ? AND status = ? ORDER BY opened_at DESC LIMIT 1',
    [storeId, 'open']
  )
}

export async function saveShift(db: SQLiteDatabase, shift: DBShift): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO shifts (shift_number, id, store_id, status, opened_at, closed_at, opened_by_user_id, closed_by_user_id, initial_cash, inventory_balance, notes, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [shift.shift_number, shift.id, shift.store_id, shift.status, shift.opened_at, shift.closed_at ?? null, shift.opened_by_user_id ?? null, shift.closed_by_user_id ?? null, shift.initial_cash ?? null, shift.inventory_balance ?? null, shift.notes ?? null, shift.sync_status, shift.created_at, shift.updated_at]
  )
}
