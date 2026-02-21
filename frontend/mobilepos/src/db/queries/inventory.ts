import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBInventoryEntry {
  entry_number: string
  id: number
  store_id: number
  vendor_id?: number | null
  entry_type: string
  entry_date: string
  notes?: string | null
  created_by_user_id?: number | null
  shift_id?: number | null
  shift_number?: string | null
  sync_status: string
  created_at: string
  updated_at: string
}

export interface DBInventoryEntryDetail {
  id?: number
  entry_number: string
  entry_id: number
  material_id?: number | null
  product_id?: number | null
  quantity: number
  unit_of_measure_id?: number | null
  unit_cost?: number | null
  total_cost?: number | null
  sync_status: string
}

export async function getInventoryEntriesByShift(db: SQLiteDatabase, shiftNumber: string): Promise<DBInventoryEntry[]> {
  return db.getAllAsync<DBInventoryEntry>(
    'SELECT * FROM inventory_entries WHERE shift_number = ? ORDER BY created_at DESC',
    [shiftNumber]
  )
}

export async function saveInventoryEntry(
  db: SQLiteDatabase,
  data: {
    store_id: number
    entry_type: string
    entry_date: string
    notes?: string
    shift_number?: string
    created_by_user_id?: number
  }
): Promise<string> {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const entryNumber = `INV-${dateStr}-${Date.now().toString(36).toUpperCase()}`

  await db.runAsync(
    `INSERT INTO inventory_entries (entry_number, id, store_id, entry_type, entry_date, notes, created_by_user_id, shift_number, sync_status, created_at, updated_at)
     VALUES (?, 0, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [entryNumber, data.store_id, data.entry_type, data.entry_date, data.notes ?? null, data.created_by_user_id ?? null, data.shift_number ?? null, now.toISOString(), now.toISOString()]
  )
  return entryNumber
}

export async function saveInventoryEntryDetail(
  db: SQLiteDatabase,
  data: {
    entry_number: string
    material_id?: number | null
    product_id?: number | null
    quantity: number
    unit_of_measure_id?: number | null
    unit_cost?: number | null
    total_cost?: number | null
  }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO inventory_entry_details (entry_number, entry_id, material_id, product_id, quantity, unit_of_measure_id, unit_cost, total_cost, sync_status)
     VALUES (?, 0, ?, ?, ?, ?, ?, ?, 'pending')`,
    [data.entry_number, data.material_id ?? null, data.product_id ?? null, data.quantity, data.unit_of_measure_id ?? null, data.unit_cost ?? null, data.total_cost ?? null]
  )
  return result.lastInsertRowId
}

export async function getInventoryEntryDetails(db: SQLiteDatabase, entryNumber: string): Promise<DBInventoryEntryDetail[]> {
  return db.getAllAsync<DBInventoryEntryDetail>(
    'SELECT * FROM inventory_entry_details WHERE entry_number = ?',
    [entryNumber]
  )
}
