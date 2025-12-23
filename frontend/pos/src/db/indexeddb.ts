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
    key: string // PRIMARY KEY: order_number (local identifier, always present)
    value: {
      order_number: string // PRIMARY KEY: Local identifier, always present
      id: number | string // 0 for unsynced, numeric ID after sync (reference only, not used for local operations)
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
    indexes: { 'by-status': string; 'by-sync-status': string; 'by-store': number; 'by-table': number; 'by-id': number | string; 'by-order-number': string }
  }
  order_items: {
    key: number
    value: {
      id: string
      order_id?: string | number // Only present after sync (remote ID)
      order_number?: string // Local relationship key (optional for backward compatibility, but should always be set)
      product_id: number
      product_name: string
      quantity: number
      unit_price: number
      tax_rate: number
      total: number
      tax_amount: number
      sync_status: 'synced' | 'pending' | 'error'
    }
    indexes: { 'by-order': string; 'by-order-number': string; 'by-sync-status': string }
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
  unit_of_measures: {
    key: number
    value: {
      id: number
      name: string
      abbreviation: string
      type: string
      is_active: boolean
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-sync-status': string }
  }
  product_unit_of_measures: {
    key: number
    value: {
      id: number
      product_id: number
      unit_of_measure_id: number
      conversion_factor: number
      is_base_unit: boolean
      display_order: number
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-product': number; 'by-uofm': number; 'by-sync-status': string }
  }
  material_unit_of_measures: {
    key: number
    value: {
      id: number
      material_id: number
      unit_of_measure_id: number
      conversion_factor: number
      is_base_unit: boolean
      display_order: number
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-material': number; 'by-uofm': number; 'by-sync-status': string }
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
    key: string // PRIMARY KEY: entry_number (local identifier, always present)
    value: {
      entry_number: string // PRIMARY KEY: Local identifier, always present
      id: number // 0 for unsynced, numeric ID after sync (reference only, not used for local operations)
      store_id: number
      vendor_id?: number
      entry_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste' | 'return'
      entry_date: string
      notes?: string
      created_by_user_id?: number
      shift_id?: number
      shift_number?: string
      sync_status: 'synced' | 'pending' | 'error'
      created_at: string
      updated_at: string
    }
    indexes: { 'by-sync-status': string; 'by-store': number; 'by-entry-type': string; 'by-shift': number; 'by-shift-number': string; 'by-id': number }
  }
  inventory_entry_details: {
    key: number
    value: {
      id: number
      entry_number: string // Local link to inventory_entries table (offline-first)
      entry_id: number
      material_id?: number
      product_id?: number
      quantity: number
      unit_of_measure_id?: number
      unit_cost?: number
      total_cost?: number
      sync_status: 'synced' | 'pending' | 'error'
    }
    indexes: { 'by-entry': number; 'by-entry-number': string; 'by-sync-status': string }
  }
  shifts: {
    key: string // PRIMARY KEY: shift_number
    value: {
      shift_number: string // PRIMARY KEY: Local identifier, always present
      id: number | string // 0 for unsynced, numeric ID after sync (used only for remote sync)
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
    indexes: { 'by-status': string; 'by-sync-status': string; 'by-store': number; 'by-id': number }
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
  inventory_control_config: {
    key: number
    value: {
      id: number
      item_type: 'Product' | 'Material'
      product_id?: number | null
      material_id?: number | null
      show_in_inventory: boolean
      priority: number
      uofm1_id?: number | null
      uofm2_id?: number | null
      uofm3_id?: number | null
      product_name?: string | null
      material_name?: string | null
      uofm1_abbreviation?: string | null
      uofm2_abbreviation?: string | null
      uofm3_abbreviation?: string | null
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-sync-status': string; 'by-show-in-inventory': boolean }
  }
  sync_queue: {
    key: number
    value: {
      id: number
      type: 'order' | 'order_item' | 'product' | 'category' | 'customer' | 'inventory_entry' | 'inventory_entry_detail' | 'shift' | 'table'
      action: 'create' | 'update' | 'delete' | 'close'
      data_id: string | number
      data: any
      retry_count: number
      created_at: string
    }
    indexes: { 'by-type': string; 'by-action': string }
  }
  document_prefixes: {
    key: number
    value: {
      id: number
      store_id?: number | null
      doc_type: 'shift' | 'invoice' | 'inventory' | 'payment'
      prefix: string
      is_active: boolean
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-store': number; 'by-doc-type': string; 'by-sync-status': string }
  }
  sequences: {
    key: string // Composite key: `${cash_register_id}-${doc_type}-${date}`
    value: {
      id: string // Composite key: `${cash_register_id}-${doc_type}-${date}`
      cash_register_id: number
      doc_type: 'shift' | 'inventory'
      date: string // YYYY-MM-DD format
      sequence_number: number
      updated_at: string
    }
    indexes: { 'by-cash-register': number; 'by-date': string; 'by-doc-type': string }
  }
  cash_drawer_config: {
    key: number
    value: {
      id: number
      device_name: string
      port_path: string
      baud_rate: number
      is_active: boolean
      created_at: string
      updated_at: string
    }
    indexes: { 'by-active': boolean }
  }
  recipes: {
    key: number
    value: {
      id: number
      product_id: number
      name: string
      description?: string
      yield_quantity: number
      yield_unit_of_measure_id?: number
      is_active: boolean
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-product': number; 'by-sync-status': string; 'by-active': boolean }
  }
  recipe_materials: {
    key: number
    value: {
      id: number
      recipe_id: number
      material_id: number
      quantity: number
      unit_of_measure_id?: number
      display_order: number
      sync_status: 'synced' | 'pending' | 'error'
      updated_at: string
    }
    indexes: { 'by-recipe': number; 'by-material': number; 'by-sync-status': string }
  }
  shift_summaries: {
    key: string // PRIMARY KEY: shift_number
    value: {
      shift_number: string
      shift_id?: number
      opened_at: string
      closed_at?: string
      initial_cash: number
      final_cash?: number
      expected_cash: number
      difference?: number
      bank_transfer_balance: number
      inventory_summary: Array<{
        item_id: number
        item_type: 'Product' | 'Material'
        item_name: string
        uofm_id: number
        uofm_abbreviation: string
        beg_balance: number
        refills: number[]
        material_usage?: number
        end_balance?: number
        diff?: number
      }>
      updated_at: string
    }
    indexes: { 'by-shift-id': number }
  }
  sync_state: {
    key: string // entity_type (e.g., 'products', 'categories', 'materials')
    value: {
      entity_type: string
      last_sync_at: string // ISO timestamp
      store_id?: number // Optional, for store-specific entities
      updated_at: string
    }
    indexes: { 'by-store': number }
  }
}

const DB_NAME = 'sofiapos-db'
const DB_VERSION = 1

export async function openDatabase(): Promise<IDBPDatabase<POSDatabase>> {
  return openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      const productStore = db.createObjectStore('products', { keyPath: 'id' })
      productStore.createIndex('by-code', 'code', { unique: true })
      productStore.createIndex('by-category', 'category_id')
      productStore.createIndex('by-sync-status', 'sync_status')

      // Orders store - use order_number as primary key
      const orderStore = db.createObjectStore('orders', { keyPath: 'order_number' })
      orderStore.createIndex('by-status', 'status')
      orderStore.createIndex('by-sync-status', 'sync_status')
      orderStore.createIndex('by-store', 'store_id')
      orderStore.createIndex('by-table', 'table_id')
      orderStore.createIndex('by-id', 'id') // Index for sync purposes only
      orderStore.createIndex('by-order-number', 'order_number') // Redundant but kept for compatibility

      // Order items store
      const orderItemStore = db.createObjectStore('order_items', { keyPath: 'id', autoIncrement: true })
      orderItemStore.createIndex('by-order', 'order_id') // For sync purposes (remote ID)
      orderItemStore.createIndex('by-order-number', 'order_number') // For local relationships
      orderItemStore.createIndex('by-sync-status', 'sync_status')

      // Categories store
      const categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
      categoryStore.createIndex('by-sync-status', 'sync_status')

      // Customers store
      const customerStore = db.createObjectStore('customers', { keyPath: 'id' })
      customerStore.createIndex('by-sync-status', 'sync_status')

      // Materials store
      const materialStore = db.createObjectStore('materials', { keyPath: 'id' })
      materialStore.createIndex('by-sync-status', 'sync_status')

      // Unit of measures store
      const unitOfMeasureStore = db.createObjectStore('unit_of_measures', { keyPath: 'id' })
      unitOfMeasureStore.createIndex('by-sync-status', 'sync_status')

      // Product unit of measures store
      const productUofmStore = db.createObjectStore('product_unit_of_measures', { keyPath: 'id' })
      productUofmStore.createIndex('by-product', 'product_id')
      productUofmStore.createIndex('by-uofm', 'unit_of_measure_id')
      productUofmStore.createIndex('by-sync-status', 'sync_status')

      // Material unit of measures store
      const materialUofmStore = db.createObjectStore('material_unit_of_measures', { keyPath: 'id' })
      materialUofmStore.createIndex('by-material', 'material_id')
      materialUofmStore.createIndex('by-uofm', 'unit_of_measure_id')
      materialUofmStore.createIndex('by-sync-status', 'sync_status')

      // Settings store
      db.createObjectStore('settings', { keyPath: 'key' })

      // Inventory entries store - use entry_number as primary key
      const inventoryEntryStore = db.createObjectStore('inventory_entries', { keyPath: 'entry_number' })
      inventoryEntryStore.createIndex('by-sync-status', 'sync_status')
      inventoryEntryStore.createIndex('by-store', 'store_id')
      inventoryEntryStore.createIndex('by-entry-type', 'entry_type')
      inventoryEntryStore.createIndex('by-shift', 'shift_id')
      inventoryEntryStore.createIndex('by-shift-number', 'shift_number')
      inventoryEntryStore.createIndex('by-id', 'id') // Index for sync purposes only

      // Inventory entry details store
      const inventoryEntryDetailStore = db.createObjectStore('inventory_entry_details', { keyPath: 'id', autoIncrement: true })
      inventoryEntryDetailStore.createIndex('by-entry', 'entry_id')
      inventoryEntryDetailStore.createIndex('by-entry-number', 'entry_number')
      inventoryEntryDetailStore.createIndex('by-sync-status', 'sync_status')

      // Shifts store - use shift_number as primary key
      const shiftStore = db.createObjectStore('shifts', { keyPath: 'shift_number' })
      shiftStore.createIndex('by-status', 'status')
      shiftStore.createIndex('by-sync-status', 'sync_status')
      shiftStore.createIndex('by-store', 'store_id')
      shiftStore.createIndex('by-id', 'id')

      // Tables store
      const tableStore = db.createObjectStore('tables', { keyPath: 'id' })
      tableStore.createIndex('by-store', 'store_id')
      tableStore.createIndex('by-sync-status', 'sync_status')
      tableStore.createIndex('by-active', 'is_active')

      // Inventory control config store
      const inventoryConfigStore = db.createObjectStore('inventory_control_config', { keyPath: 'id' })
      inventoryConfigStore.createIndex('by-sync-status', 'sync_status')
      inventoryConfigStore.createIndex('by-show-in-inventory', 'show_in_inventory')

      // Document prefixes store
      const docPrefixStore = db.createObjectStore('document_prefixes', { keyPath: 'id' })
      docPrefixStore.createIndex('by-store', 'store_id')
      docPrefixStore.createIndex('by-doc-type', 'doc_type')
      docPrefixStore.createIndex('by-sync-status', 'sync_status')

      // Sequences store
      const sequencesStore = db.createObjectStore('sequences', { keyPath: 'id' })
      sequencesStore.createIndex('by-cash-register', 'cash_register_id')
      sequencesStore.createIndex('by-date', 'date')
      sequencesStore.createIndex('by-doc-type', 'doc_type')

      // Cash drawer config store
      const cashDrawerStore = db.createObjectStore('cash_drawer_config', { keyPath: 'id', autoIncrement: true })
      cashDrawerStore.createIndex('by-active', 'is_active')

      // Recipes store
      const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' })
      recipeStore.createIndex('by-product', 'product_id')
      recipeStore.createIndex('by-sync-status', 'sync_status')
      recipeStore.createIndex('by-active', 'is_active')

      // Recipe materials store
      const recipeMaterialStore = db.createObjectStore('recipe_materials', { keyPath: 'id' })
      recipeMaterialStore.createIndex('by-recipe', 'recipe_id')
      recipeMaterialStore.createIndex('by-material', 'material_id')
      recipeMaterialStore.createIndex('by-sync-status', 'sync_status')

      // Shift summaries store
      const shiftSummaryStore = db.createObjectStore('shift_summaries', { keyPath: 'shift_number' })
      shiftSummaryStore.createIndex('by-shift-id', 'shift_id')

      // Sync queue store
      const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
      syncQueueStore.createIndex('by-type', 'type')
      syncQueueStore.createIndex('by-action', 'action')

      // Sync state store
      const syncStateStore = db.createObjectStore('sync_state', { keyPath: 'entity_type' })
      syncStateStore.createIndex('by-store', 'store_id', { unique: false })
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
  await db.clear('unit_of_measures')
  await db.clear('product_unit_of_measures')
  await db.clear('material_unit_of_measures')
  await db.clear('settings')
  await db.clear('inventory_entries')
  await db.clear('inventory_entry_details')
  await db.clear('shifts')
    await db.clear('tables')
    await db.clear('inventory_control_config')
    await db.clear('document_prefixes')
    await db.clear('sequences')
    await db.clear('cash_drawer_config')
    await db.clear('recipes')
    await db.clear('recipe_materials')
    await db.clear('shift_summaries')
    await db.clear('sync_queue')
}

