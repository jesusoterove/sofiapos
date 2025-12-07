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
      status: 'draft' | 'paid' | 'cancelled'
      subtotal: number
      taxes: number
      discount: number
      total: number
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string
    }
    indexes: { 'by-status': string; 'by-sync-status': string; 'by-store': number }
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
      total: number
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
  sync_queue: {
    key: number
    value: {
      id: number
      type: 'order' | 'order_item' | 'product' | 'category' | 'customer'
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
const DB_VERSION = 1

export async function openDatabase(): Promise<IDBPDatabase<POSDatabase>> {
  return openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        syncQueueStore.createIndex('by-type', 'type')
        syncQueueStore.createIndex('by-action', 'action')
      }
    },
  })
}

export async function clearDatabase(): Promise<void> {
  const db = await openDatabase()
  const stores = ['products', 'orders', 'order_items', 'categories', 'customers', 'sync_queue']
  for (const storeName of stores) {
    await db.clear(storeName)
  }
}

