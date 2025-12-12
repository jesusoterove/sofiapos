/**
 * Initial sync service for fetching master data on app startup.
 * Syncs: Products, Categories, Customers, Materials (Vendors), Settings, Tables, Inventory Control Config
 */
import { openDatabase, POSDatabase } from '../db'
import type { IDBPDatabase } from 'idb'
import { saveProducts } from '../db/queries/products'
import { saveCategories } from '../db/queries/categories'
import { saveTables } from '../db/queries/tables'
import { saveInventoryControlConfigs } from '../db/queries/inventoryControlConfig'
import { listProducts } from '../api/products'
import { listProductCategories } from '../api/categories'
import { listMaterials } from '../api/materials'
import { getGlobalSettings } from '../api/settings'
import { listTables } from '../api/tables'
import { getInventoryControlConfig } from '../api/inventoryControl'
import type { Product } from '../api/products'
import type { ProductCategory } from '../api/categories'
import type { Material } from '../api/materials'
import type { Setting } from '../api/settings'
import type { InventoryControlConfig } from '../api/inventoryControl'

export interface SyncProgress {
  step: 'products' | 'categories' | 'materials' | 'settings' | 'tables' | 'inventory_config' | 'complete'
  progress: number // 0-100
  message: string
}

export interface SyncResult {
  success: boolean
  error?: string
  productsCount?: number
  categoriesCount?: number
  materialsCount?: number
  settingsCount?: number
  tablesCount?: number
  inventoryConfigCount?: number
}

/**
 * Sync products from API to IndexedDB
 */
async function syncProducts(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const products = await listProducts(true)
  
  // Transform products to match IndexedDB schema
  const dbProducts = products.map((p: Product) => ({
    id: p.id,
    code: p.code || '',
    name: p.name,
    description: p.description,
    selling_price: p.selling_price,
    product_type: p.product_type,
    category_id: p.category_id,
    is_active: p.is_active,
    tax_rate: p.tax_rate || 0,
    sync_status: 'synced' as const,
    updated_at: p.updated_at || new Date().toISOString(),
  }))
  
  await saveProducts(db, dbProducts)
  return products.length
}

/**
 * Sync product categories from API to IndexedDB
 */
async function syncCategories(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const categories = await listProductCategories(true)
  
  // Transform categories to match IndexedDB schema
  const dbCategories = categories.map((c: ProductCategory) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    sync_status: 'synced' as const,
    updated_at: c.updated_at || new Date().toISOString(),
  }))
  
  await saveCategories(db, dbCategories)
  return categories.length
}

/**
 * Sync materials (vendors) from API to IndexedDB
 */
async function syncMaterials(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const materials = await listMaterials()
  
  const tx = db.transaction('materials', 'readwrite')
  await Promise.all(
    materials.map((m: Material) =>
      tx.store.put({
        id: m.id,
        name: m.name,
        description: m.description,
        unit_of_measure_id: m.unit_of_measure_id,
        unit_cost: m.unit_cost,
        vendor_id: m.vendor_id,
        is_active: m.is_active ?? true,
        sync_status: 'synced' as const,
        updated_at: m.updated_at || new Date().toISOString(),
      })
    )
  )
  await tx.done
  
  return materials.length
}

/**
 * Sync settings from API to IndexedDB
 */
async function syncSettings(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const settings = await getGlobalSettings()
  
  const tx = db.transaction('settings', 'readwrite')
  await Promise.all(
    settings.map((s: Setting) =>
      tx.store.put({
        key: s.key,
        value: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
        store_id: s.store_id,
        updated_at: new Date().toISOString(),
      })
    )
  )
  await tx.done
  
  return settings.length
}

/**
 * Sync tables from API to IndexedDB
 */
async function syncTables(db: IDBPDatabase<POSDatabase>, storeId?: number): Promise<number> {
  const tables = await listTables(storeId, true)
  
  await saveTables(db, tables)
  return tables.length
}

/**
 * Sync inventory control config from API to IndexedDB
 */
async function syncInventoryControlConfig(db: IDBPDatabase<POSDatabase>, storeId: number): Promise<number> {
  const configs = await getInventoryControlConfig(storeId)
  
  // Transform configs to match IndexedDB schema
  const dbConfigs = configs.map((c: InventoryControlConfig) => ({
    id: c.id,
    item_type: c.item_type,
    product_id: c.product_id ?? null,
    material_id: c.material_id ?? null,
    show_in_inventory: c.show_in_inventory,
    priority: c.priority,
    uofm1_id: c.uofm1_id ?? null,
    uofm2_id: c.uofm2_id ?? null,
    uofm3_id: c.uofm3_id ?? null,
    product_name: c.product_name ?? null,
    material_name: c.material_name ?? null,
    uofm1_abbreviation: c.uofm1_abbreviation ?? null,
    uofm2_abbreviation: c.uofm2_abbreviation ?? null,
    uofm3_abbreviation: c.uofm3_abbreviation ?? null,
    sync_status: 'synced' as const,
    updated_at: new Date().toISOString(),
  }))
  
  await saveInventoryControlConfigs(db, dbConfigs)
  return configs.length
}

/**
 * Perform initial sync of all master data.
 * Returns progress updates via callback.
 */
export async function performInitialSync(
  onProgress?: (progress: SyncProgress) => void,
  storeId?: number
): Promise<SyncResult> {
  try {
    const db = await openDatabase()
    
    // Sync Products (15%)
    onProgress?.({
      step: 'products',
      progress: 0,
      message: 'Syncing products...',
    })
    const productsCount = await syncProducts(db)
    onProgress?.({
      step: 'products',
      progress: 15,
      message: `Synced ${productsCount} products`,
    })
    
    // Sync Categories (30%)
    onProgress?.({
      step: 'categories',
      progress: 15,
      message: 'Syncing categories...',
    })
    const categoriesCount = await syncCategories(db)
    onProgress?.({
      step: 'categories',
      progress: 30,
      message: `Synced ${categoriesCount} categories`,
    })
    
    // Sync Materials/Vendors (45%)
    onProgress?.({
      step: 'materials',
      progress: 30,
      message: 'Syncing materials...',
    })
    const materialsCount = await syncMaterials(db)
    onProgress?.({
      step: 'materials',
      progress: 45,
      message: `Synced ${materialsCount} materials`,
    })
    
    // Sync Settings (60%)
    onProgress?.({
      step: 'settings',
      progress: 45,
      message: 'Syncing settings...',
    })
    const settingsCount = await syncSettings(db)
    onProgress?.({
      step: 'settings',
      progress: 60,
      message: `Synced ${settingsCount} settings`,
    })
    
    // Sync Tables (70%)
    onProgress?.({
      step: 'tables',
      progress: 60,
      message: 'Syncing tables...',
    })
    const tablesCount = await syncTables(db, storeId)
    onProgress?.({
      step: 'tables',
      progress: 70,
      message: `Synced ${tablesCount} tables`,
    })
    
    // Sync Inventory Control Config (85%)
    let inventoryConfigCount = 0
    if (storeId) {
      onProgress?.({
        step: 'inventory_config',
        progress: 70,
        message: 'Syncing inventory control config...',
      })
      inventoryConfigCount = await syncInventoryControlConfig(db, storeId)
      onProgress?.({
        step: 'inventory_config',
        progress: 85,
        message: `Synced ${inventoryConfigCount} inventory config items`,
      })
    } else {
      onProgress?.({
        step: 'inventory_config',
        progress: 85,
        message: 'Skipping inventory config (no store ID)',
      })
    }
    
    // Complete (100%)
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Sync complete!',
    })
    
    return {
      success: true,
      productsCount,
      categoriesCount,
      materialsCount,
      settingsCount,
      tablesCount,
      inventoryConfigCount: storeId ? inventoryConfigCount : undefined,
    }
  } catch (error: any) {
    // Extract more detailed error message
    let errorMessage = 'Unknown error'
    
    if (error?.response?.status === 401) {
      errorMessage = 'Authentication failed. Please log in again.'
    } else if (error?.response?.status === 403) {
      errorMessage = 'Access denied. You do not have permission to sync data.'
    } else if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    onProgress?.({
      step: 'complete',
      progress: 0,
      message: `Sync failed: ${errorMessage}`,
    })
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Check if initial sync has been completed.
 */
export async function hasCompletedInitialSync(): Promise<boolean> {
  try {
    const db = await openDatabase()
    const products = await db.getAll('products')
    // Consider sync complete if we have at least some products
    return products.length > 0
  } catch {
    return false
  }
}

