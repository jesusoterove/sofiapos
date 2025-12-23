/**
 * Incremental sync service for syncing only changed records.
 * This service runs silently in the background and never interrupts POS operations.
 */
import { openDatabase, POSDatabase } from '../db'
import type { IDBPDatabase } from 'idb'
import { getLastSyncTimestamp, updateLastSyncTimestamp } from '../db/queries/syncState'
import { checkForUpdates, getIncrementalUpdates } from '../api/incrementalSync'
import { saveProducts } from '../db/queries/products'
import { saveCategories } from '../db/queries/categories'
import { saveTables } from '../db/queries/tables'
import { saveInventoryControlConfigs } from '../db/queries/inventoryControlConfig'
import { saveDocumentPrefixes } from '../db/queries/documentPrefixes'
import { saveRecipes, saveRecipeMaterials } from '../db/queries/recipes'
import { saveUnitOfMeasures, saveProductUnitOfMeasures, saveMaterialUnitOfMeasures } from '../db/queries/unitOfMeasures'
import { downloadProductImage } from '../utils/productImages'
import { queryClient } from '../app/queryClient'
import type { Product } from '../api/products'
import type { ProductCategory } from '../api/categories'
import type { Material } from '../api/materials'
import type { Recipe, RecipeMaterial } from '../api/recipes'
import type { InventoryControlConfig } from '../api/inventoryControl'
import type { DocumentPrefix } from '../api/documentPrefixes'

// Entity types that require store_id
const STORE_SPECIFIC_ENTITIES = ['tables', 'inventory_config', 'document_prefixes']

// Entity types that are global (no store_id)
const GLOBAL_ENTITIES = [
  'products',
  'categories',
  'materials',
  'unit_of_measures',
  'product_unit_of_measures',
  'material_unit_of_measures',
  'recipes',
  'recipe_materials',
  'settings',
]

export interface IncrementalSyncResult {
  success: boolean
  entityType: string
  recordsUpdated: number
  error?: string
}

/**
 * Sync a single entity type incrementally.
 * @param entityType Entity type to sync
 * @param storeId Optional store ID for store-specific entities
 * @returns Result of the sync operation
 */
export async function syncEntityType(
  entityType: string,
  storeId?: number
): Promise<IncrementalSyncResult> {
  const db = await openDatabase()
  try {
    // Get last sync timestamp (falls back to registration timestamp if not found)
    const lastSync = await getLastSyncTimestamp(db, entityType, storeId)
    
    // If no timestamp available (no registration), skip
    // This should only happen if the POS is not registered yet
    if (!lastSync) {
      console.log(`[incrementalSync] Skipping ${entityType} - no sync timestamp and no registration found`)
      return {
        success: true,
        entityType,
        recordsUpdated: 0,
      }
    }

    // Get incremental updates
    const updates = await getIncrementalUpdates(entityType, lastSync, storeId)
    
    if (updates.length === 0) {
      // No updates, but still update timestamp to current time
      await updateLastSyncTimestamp(db, entityType, new Date().toISOString(), storeId)
      return {
        success: true,
        entityType,
        recordsUpdated: 0,
      }
    }

    console.log(`[incrementalSync] Syncing ${updates.length} ${entityType} records`)

    // Process updates based on entity type
    let recordsUpdated = 0

    switch (entityType) {
      case 'products':
        recordsUpdated = await syncProducts(db, updates)
        // Download images for updated products
        await downloadProductImagesForUpdates(updates as Product[])
        break
      case 'categories':
        recordsUpdated = await syncCategories(db, updates)
        break
      case 'materials':
        recordsUpdated = await syncMaterials(db, updates)
        break
      case 'unit_of_measures':
        recordsUpdated = await syncUnitOfMeasures(db, updates)
        break
      case 'product_unit_of_measures':
        recordsUpdated = await syncProductUnitOfMeasures(db, updates)
        break
      case 'material_unit_of_measures':
        recordsUpdated = await syncMaterialUnitOfMeasures(db, updates)
        break
      case 'recipes':
        recordsUpdated = await syncRecipes(db, updates)
        break
      case 'recipe_materials':
        recordsUpdated = await syncRecipeMaterials(db, updates)
        break
      case 'settings':
        recordsUpdated = await syncSettings(db, updates)
        break
      case 'tables':
        if (storeId) {
          recordsUpdated = await syncTables(db, updates)
        }
        break
      case 'inventory_config':
        if (storeId) {
          recordsUpdated = await syncInventoryConfig(db, updates)
        }
        break
      case 'document_prefixes':
        if (storeId) {
          recordsUpdated = await syncDocumentPrefixes(db, updates)
        }
        break
      default:
        console.warn(`[incrementalSync] Unknown entity type: ${entityType}`)
        return {
          success: false,
          entityType,
          recordsUpdated: 0,
          error: `Unknown entity type: ${entityType}`,
        }
    }

    // Update sync timestamp
    await updateLastSyncTimestamp(db, entityType, new Date().toISOString(), storeId)

    return {
      success: true,
      entityType,
      recordsUpdated,
    }
  } catch (error: any) {
    console.error(`[incrementalSync] Error syncing ${entityType}:`, error)
    return {
      success: false,
      entityType,
      recordsUpdated: 0,
      error: error?.message || 'Unknown error',
    }
  }
}

/**
 * Perform incremental sync for all entity types.
 * @param storeId Store ID for store-specific entities
 * @param onProgress Optional progress callback
 * @returns Array of sync results
 */
export async function performIncrementalSync(
  storeId?: number,
  onProgress?: (result: IncrementalSyncResult) => void
): Promise<IncrementalSyncResult[]> {
  const results: IncrementalSyncResult[] = []

  try {
    // Get last sync timestamp (use earliest timestamp if multiple entity types)
    // For simplicity, we'll sync all entity types
    const entityTypes = storeId
      ? [...GLOBAL_ENTITIES, ...STORE_SPECIFIC_ENTITIES]
      : GLOBAL_ENTITIES

    for (const entityType of entityTypes) {
      const result = await syncEntityType(entityType, storeId)
      results.push(result)
      onProgress?.(result)
    }

    return results
  } catch (error: any) {
    console.error('[performIncrementalSync] Error during incremental sync:', error)
    // Don't throw - return results so far
    return results
  }
}

/**
 * Check for updates and sync only entity types that have changes.
 * More efficient than syncing all entity types.
 * @param storeId Store ID for store-specific entities
 * @param onProgress Optional progress callback
 * @returns Array of sync results
 */
export async function checkAndSyncUpdates(
  storeId?: number,
  onProgress?: (result: IncrementalSyncResult) => void
): Promise<IncrementalSyncResult[]> {
  const results: IncrementalSyncResult[] = []

  try {
    // Get the earliest last sync timestamp across all entity types
    // For simplicity, we'll use a timestamp from 1 hour ago as a fallback
    const fallbackTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Check which entity types have updates
    const updatesAvailable = await checkForUpdates(fallbackTimestamp, storeId)

    // Sync only entity types that have updates
    const entityTypesToSync = Object.entries(updatesAvailable)
      .filter(([_, hasUpdates]) => hasUpdates)
      .map(([entityType]) => entityType)

    if (entityTypesToSync.length === 0) {
      console.log('[checkAndSyncUpdates] No updates available')
      return results
    }

    console.log(`[checkAndSyncUpdates] Found updates for: ${entityTypesToSync.join(', ')}`)

    for (const entityType of entityTypesToSync) {
      const result = await syncEntityType(entityType, storeId)
      results.push(result)
      onProgress?.(result)
    }

    return results
  } catch (error: any) {
    console.error('[checkAndSyncUpdates] Error checking and syncing updates:', error)
    // Don't throw - return results so far
    return results
  }
}

// Entity-specific sync functions

async function syncProducts(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbProducts = updates.map((p: Product) => ({
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
  
  // Invalidate product queries to refresh the product selection panel
  queryClient.invalidateQueries({ queryKey: ['all-products'] })
  queryClient.invalidateQueries({ queryKey: ['products'] })
  
  return dbProducts.length
}

async function syncCategories(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbCategories = updates.map((c: ProductCategory) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    sync_status: 'synced' as const,
    updated_at: c.updated_at || new Date().toISOString(),
  }))
  await saveCategories(db, dbCategories)
  
  // Invalidate category queries to refresh the product selection panel
  queryClient.invalidateQueries({ queryKey: ['categories'] })
  
  return dbCategories.length
}

async function syncMaterials(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const tx = db.transaction('materials', 'readwrite')
  await Promise.all(
    updates.map((m: Material) =>
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
  return updates.length
}

async function syncUnitOfMeasures(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbUnits = updates.map((u) => ({
    id: u.id,
    name: u.name,
    abbreviation: u.abbreviation,
    type: u.type,
    is_active: u.is_active,
    sync_status: 'synced' as const,
    updated_at: new Date().toISOString(),
  }))
  await saveUnitOfMeasures(db, dbUnits)
  return dbUnits.length
}

async function syncProductUnitOfMeasures(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbUnits = updates.map((u) => ({
    id: u.id,
    product_id: u.product_id,
    unit_of_measure_id: u.unit_of_measure_id,
    conversion_factor: u.conversion_factor,
    is_base_unit: u.is_base_unit,
    display_order: u.display_order,
    sync_status: 'synced' as const,
    updated_at: new Date().toISOString(),
  }))
  await saveProductUnitOfMeasures(db, dbUnits)
  return dbUnits.length
}

async function syncMaterialUnitOfMeasures(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbUnits = updates.map((u) => ({
    id: u.id,
    material_id: u.material_id,
    unit_of_measure_id: u.unit_of_measure_id,
    conversion_factor: u.conversion_factor,
    is_base_unit: u.is_base_unit,
    display_order: u.display_order,
    sync_status: 'synced' as const,
    updated_at: new Date().toISOString(),
  }))
  await saveMaterialUnitOfMeasures(db, dbUnits)
  return dbUnits.length
}

async function syncRecipes(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbRecipes = updates.map((r: Recipe) => ({
    id: r.id,
    product_id: r.product_id,
    name: r.name,
    description: r.description,
    yield_quantity: r.yield_quantity,
    yield_unit_of_measure_id: r.yield_unit_of_measure_id,
    is_active: r.is_active,
    sync_status: 'synced' as const,
    updated_at: r.updated_at || new Date().toISOString(),
  }))
  await saveRecipes(db, dbRecipes)
  return dbRecipes.length
}

async function syncRecipeMaterials(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbMaterials = updates.map((m: RecipeMaterial) => ({
    id: m.id,
    recipe_id: m.recipe_id,
    material_id: m.material_id,
    quantity: m.quantity,
    unit_of_measure_id: m.unit_of_measure_id,
    display_order: m.display_order,
    sync_status: 'synced' as const,
    updated_at: m.updated_at || new Date().toISOString(),
  }))
  await saveRecipeMaterials(db, dbMaterials)
  return dbMaterials.length
}

async function syncSettings(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const tx = db.transaction('settings', 'readwrite')
  await Promise.all(
    updates.map((s) =>
      tx.store.put({
        key: s.key,
        value: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
        store_id: s.store_id,
        updated_at: new Date().toISOString(),
      })
    )
  )
  await tx.done
  return updates.length
}

async function syncTables(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  await saveTables(db, updates)
  return updates.length
}

async function syncInventoryConfig(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbConfigs = updates.map((c: InventoryControlConfig) => ({
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
  return dbConfigs.length
}

async function syncDocumentPrefixes(db: IDBPDatabase<POSDatabase>, updates: any[]): Promise<number> {
  const dbPrefixes = updates.map((p: DocumentPrefix) => ({
    id: p.id,
    store_id: p.store_id ?? null,
    doc_type: p.doc_type,
    prefix: p.prefix,
    is_active: p.is_active,
    sync_status: 'synced' as const,
    updated_at: p.updated_at || new Date().toISOString(),
  }))
  await saveDocumentPrefixes(db, dbPrefixes)
  return dbPrefixes.length
}

/**
 * Download product images for updated products.
 * Runs in background, errors are logged but don't fail the sync.
 */
async function downloadProductImagesForUpdates(products: Product[]): Promise<void> {
  const BATCH_SIZE = 5
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (p) => {
        if (p.id && p.code) {
          try {
            await downloadProductImage(p.id, p.code)
          } catch (error) {
            // Log but don't fail sync if image download fails
            console.error(`[downloadProductImagesForUpdates] Failed to download image for product ${p.id}:`, error)
          }
        }
      })
    )
  }
}

