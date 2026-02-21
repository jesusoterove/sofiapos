import type { SQLiteDatabase } from 'expo-sqlite'

export interface DBOrder {
  order_number: string
  id: number
  store_id: number
  shift_id?: number | null
  cash_register_id?: number | null
  customer_id?: number | null
  table_id?: number | null
  status: string
  subtotal: number
  taxes: number
  discount: number
  total: number
  payment_method?: string | null
  amount_paid?: number | null
  sync_status: string
  created_at: string
  updated_at: string
}

export interface DBOrderItem {
  id?: number
  order_number: string
  order_id?: number | null
  product_id: number
  product_name: string
  quantity: number
  unit_of_measure_id?: number | null
  unit_price: number
  tax_rate: number
  tax_amount: number
  total: number
  sync_status: string
}

export async function saveOrder(db: SQLiteDatabase, order: DBOrder): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO orders (order_number, id, store_id, shift_id, cash_register_id, customer_id, table_id, status, subtotal, taxes, discount, total, payment_method, amount_paid, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order.order_number, order.id, order.store_id, order.shift_id ?? null, order.cash_register_id ?? null, order.customer_id ?? null, order.table_id ?? null, order.status, order.subtotal, order.taxes, order.discount, order.total, order.payment_method ?? null, order.amount_paid ?? null, order.sync_status, order.created_at, order.updated_at]
  )
}

export async function saveOrderItem(db: SQLiteDatabase, item: DBOrderItem): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO order_items (order_number, order_id, product_id, product_name, quantity, unit_of_measure_id, unit_price, tax_rate, tax_amount, total, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.order_number, item.order_id ?? null, item.product_id, item.product_name, item.quantity, item.unit_of_measure_id ?? null, item.unit_price, item.tax_rate, item.tax_amount, item.total, item.sync_status]
  )
  return result.lastInsertRowId
}

export async function getOrderItemsByOrderNumber(db: SQLiteDatabase, orderNumber: string): Promise<DBOrderItem[]> {
  return db.getAllAsync<DBOrderItem>(
    'SELECT * FROM order_items WHERE order_number = ?',
    [orderNumber]
  )
}

export async function getOrdersByStatus(db: SQLiteDatabase, status: string): Promise<DBOrder[]> {
  return db.getAllAsync<DBOrder>('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', [status])
}

export async function getDraftOrders(db: SQLiteDatabase): Promise<DBOrder[]> {
  return getOrdersByStatus(db, 'draft')
}
