/**
 * IndexedDB setup and utilities for offline storage.
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface POSDatabase extends DBSchema {
  products: {
    key: number
    value: {
      id: number
      code: string
      name: string
      description?: string
      selling_price: number
      product_type: string
      category_id?: number
      is_active: boolean
      tax_rate: number
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-code': string; 'by-category': number; 'by-sync-status': string }
  }
  orders: {
    key: number
    value: {
      id: string
      order_number: string
      store_id: number
      customer_id?: number
      table_id?: number | null
      status: 'draft' | 'paid' | 'cancelled'
      subtotal: number
      taxes: number
      discount: number
      total: number
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string
    }
    indexes: { 'by-status': string; 'by-sync-status': string; 'by-store': number; 'by-table': number }
  }
  order_items: {
    key: number
    value: {
      id: string
      order_id: string
      product_id: number
      product_name: string
      quantity: number
      unit_price: number
      tax_rate: number
      total: number
      tax_amount: number
      sync_status: 'synced' | 'pending' | 'error'
    }
    indexes: { 'by-order': string; 'by-sync-status': string }
  }
  categories: {
    key: number
    value: {
      id: number
      name: string
      description?: string
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-sync-status': string }
  }
  customers: {
    key: number
    value: {
      id: number
      name: string
      email?: string
      phone?: string
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-sync-status': string }
  }
  materials: {
    key: number
    value: {
      id: number
      name: string
      description?: string
      unit_of_measure_id?: number
      unit_cost?: number
      vendor_id?: number
      is_active: boolean
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-sync-status': string }
  }
  settings: {
    key: string
    value: {
      key: string
      value: string
      store_id?: number
      updated_at: string
    }
  }
  inventory_entries: {
    key: number
    value: {
      id: number
      store_id: number
      vendor_id?: number
      entry_number: string
      entry_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste' | 'return'
      entry_date: string
      notes?: string
      created_by_user_id?: number
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string
    }
    indexes: { 'by-sync-status': string; 'by-store': number; 'by-entry-type': string }
  }
  inventory_transactions: {
    key: number
    value: {
      id: number
      entry_id: number
      material_id?: number
      product_id?: number
      quantity: number
      unit_of_measure_id?: number
      unit_cost?: number
      total_cost?: number
      notes?: string
      sync_status: 'synced' | 'pending' | 'error'
    }
    indexes: { 'by-entry': number; 'by-sync-status': string }
  }
  shifts: {
    key: number
    value: {
      id: number | string
      shift_number: string
      store_id: number
      status: 'open' | 'closed'
      opened_at: string
      closed_at?: string
      opened_by_user_id?: number
      closed_by_user_id?: number
      initial_cash?: number
      inventory_balance?: number
      notes?: string
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string
    }
    indexes: { 'by-status': string; 'by-sync-status': string; 'by-store': number }
  }
  tables: {
    key: number
    value: {
      id: number
      store_id: number
      table_number: string
      name: string | null
      capacity: number
      location: string | null
      is_active: boolean
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string | null
    }
    indexes: { 'by-store': number; 'by-sync-status': string; 'by-active': boolean }
  }
  sync_queue: {
    key: number
    value: {
      id: number
      type: 'order' | 'order_item' | 'product' | 'category' | 'customer' | 'inventory_entry' | 'inventory_transaction' | 'shift' | 'table'
      action: 'create' | 'update' | 'delete'
      data_id: string | number
      data: any
      retry_count: number
      created_at: string
    }
    indexes: { 'by-type': string; 'by-action': string }
  }
}

const DB_NAME = 'sofiapos-db'
const DB_VERSION = 4

export async function openDatabase(): Promise<IDBPDatabase<POSDatabase>> {
  return openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' })
        productStore.createIndex('by-code', 'code', { unique: true })
        productStore.createIndex('by-category', 'category_id')
        productStore.createIndex('by-sync-status', 'sync_status')
      }

      // Orders store
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { keyPath: 'id' })
        orderStore.createIndex('by-status', 'status')
        orderStore.createIndex('by-sync-status', 'sync_status')
        orderStore.createIndex('by-store', 'store_id')
        orderStore.createIndex('by-table', 'table_id')
      } else if (oldVersion < 2) {
        // Add by-table index if it doesn't exist (for existing databases upgrading to v2)
        const orderStore = transaction.objectStore('orders')
        if (!orderStore.indexNames.contains('by-table')) {
          orderStore.createIndex('by-table', 'table_id')
        }
      }

      // Order items store
      if (!db.objectStoreNames.contains('order_items')) {
        const orderItemStore = db.createObjectStore('order_items', { keyPath: 'id', autoIncrement: true })
        orderItemStore.createIndex('by-order', 'order_id')
        orderItemStore.createIndex('by-sync-status', 'sync_status')
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
        categoryStore.createIndex('by-sync-status', 'sync_status')
      }

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' })
        customerStore.createIndex('by-sync-status', 'sync_status')
      }

      // Materials (Vendors) store
      if (!db.objectStoreNames.contains('materials')) {
        const materialStore = db.createObjectStore('materials', { keyPath: 'id' })
        materialStore.createIndex('by-sync-status', 'sync_status')
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      // Inventory entries store (added in version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains('inventory_entries')) {
        const inventoryEntryStore = db.createObjectStore('inventory_entries', { keyPath: 'id', autoIncrement: true })
        inventoryEntryStore.createIndex('by-sync-status', 'sync_status')
        inventoryEntryStore.createIndex('by-store', 'store_id')
        inventoryEntryStore.createIndex('by-entry-type', 'entry_type')
      }

      // Inventory transactions store (added in version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains('inventory_transactions')) {
        const inventoryTransactionStore = db.createObjectStore('inventory_transactions', { keyPath: 'id', autoIncrement: true })
        inventoryTransactionStore.createIndex('by-entry', 'entry_id')
        inventoryTransactionStore.createIndex('by-sync-status', 'sync_status')
      }

      // Shifts store (added in version 3)
      // Check if store doesn't exist (for any upgrade scenario)
      if (!db.objectStoreNames.contains('shifts')) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' })
        shiftStore.createIndex('by-status', 'status')
        shiftStore.createIndex('by-sync-status', 'sync_status')
        shiftStore.createIndex('by-store', 'store_id')
      }

      // Tables store (added in version 4)
      if (!db.objectStoreNames.contains('tables')) {
        const tableStore = db.createObjectStore('tables', { keyPath: 'id' })
        tableStore.createIndex('by-store', 'store_id')
        tableStore.createIndex('by-sync-status', 'sync_status')
        tableStore.createIndex('by-active', 'is_active')
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        syncQueueStore.createIndex('by-type', 'type')
        syncQueueStore.createIndex('by-action', 'action')
      } else if (oldVersion < 2) {
        // Update sync_queue type enum to include inventory types (for existing databases)
        // Note: IndexedDB doesn't support modifying existing stores, but we can ensure the type is correct in code
      }
    },
  })
}

export async function clearDatabase(): Promise<void> {
  const db = await openDatabase()
  await db.clear('products')
  await db.clear('orders')
  await db.clear('order_items')
  await db.clear('categories')
  await db.clear('customers')
  await db.clear('materials')
  await db.clear('settings')
  await db.clear('inventory_entries')
  await db.clear('inventory_transactions')
  await db.clear('shifts')
  await db.clear('tables')
  await db.clear('sync_queue')
}

