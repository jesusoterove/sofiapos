/**
 * Initial sync service for fetching master data on app startup.
 * Syncs: Products, Customers, Materials (Vendors), Settings
 */
import { openDatabase, POSDatabase } from '../db'
import type { IDBPDatabase } from 'idb'
import { saveProducts } from '../db/queries/products'
import { listProducts } from '../api/products'
import { listMaterials } from '../api/materials'
import { getGlobalSettings } from '../api/settings'
import type { Product } from '../api/products'
import type { Material } from '../api/materials'
import type { Setting } from '../api/settings'

export interface SyncProgress {
  step: 'products' | 'materials' | 'settings' | 'complete'
  progress: number // 0-100
  message: string
}

export interface SyncResult {
  success: boolean
  error?: string
  productsCount?: number
  materialsCount?: number
  settingsCount?: number
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
        value: s.value,
        store_id: s.store_id,
        updated_at: new Date().toISOString(),
      })
    )
  )
  await tx.done
  
  return settings.length
}

/**
 * Perform initial sync of all master data.
 * Returns progress updates via callback.
 */
export async function performInitialSync(
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  try {
    const db = await openDatabase()
    
    // Sync Products (25%)
    onProgress?.({
      step: 'products',
      progress: 0,
      message: 'Syncing products...',
    })
    const productsCount = await syncProducts(db)
    onProgress?.({
      step: 'products',
      progress: 25,
      message: `Synced ${productsCount} products`,
    })
    
    // Sync Materials/Vendors (50%)
    onProgress?.({
      step: 'materials',
      progress: 25,
      message: 'Syncing materials...',
    })
    const materialsCount = await syncMaterials(db)
    onProgress?.({
      step: 'materials',
      progress: 50,
      message: `Synced ${materialsCount} materials`,
    })
    
    // Sync Settings (75%)
    onProgress?.({
      step: 'settings',
      progress: 50,
      message: 'Syncing settings...',
    })
    const settingsCount = await syncSettings(db)
    onProgress?.({
      step: 'settings',
      progress: 75,
      message: `Synced ${settingsCount} settings`,
    })
    
    // Complete (100%)
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Sync complete!',
    })
    
    return {
      success: true,
      productsCount,
      materialsCount,
      settingsCount,
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

