import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBProduct {
  id: number
  code: string
  name: string
  description?: string | null
  selling_price: number
  product_type: string
  category_id?: number | null
  is_active: number
  tax_rate: number
  sync_status: string
  updated_at: string
}

export async function getAllProducts(db: SQLiteDatabase): Promise<DBProduct[]> {
  return db.getAllAsync<DBProduct>('SELECT * FROM products WHERE is_active = 1 ORDER BY name')
}

export async function getProductsByCategory(db: SQLiteDatabase, categoryId: number): Promise<DBProduct[]> {
  return db.getAllAsync<DBProduct>(
    'SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY name',
    [categoryId]
  )
}

export async function searchProducts(db: SQLiteDatabase, query: string): Promise<DBProduct[]> {
  const pattern = `%${query}%`
  return db.getAllAsync<DBProduct>(
    'SELECT * FROM products WHERE is_active = 1 AND (name LIKE ? OR code LIKE ?) ORDER BY name',
    [pattern, pattern]
  )
}

export async function saveProducts(db: SQLiteDatabase, products: DBProduct[]): Promise<void> {
  for (const p of products) {
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, code, name, description, selling_price, product_type, category_id, is_active, tax_rate, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.code, p.name, p.description ?? null, p.selling_price, p.product_type, p.category_id ?? null, p.is_active, p.tax_rate, p.sync_status, p.updated_at]
    )
  }
}

export async function getProductCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products')
  return row?.count ?? 0
}
