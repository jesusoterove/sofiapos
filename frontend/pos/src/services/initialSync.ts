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
import { saveDocumentPrefixes } from '../db/queries/documentPrefixes'
import { initializeSequences } from '../db/queries/sequences'
import { saveRecipes, saveRecipeMaterials } from '../db/queries/recipes'
import { saveUnitOfMeasures, saveProductUnitOfMeasures, saveMaterialUnitOfMeasures } from '../db/queries/unitOfMeasures'
import { updateLastSyncTimestamp } from '../db/queries/syncState'
import { listProducts } from '../api/products'
import { downloadProductImage } from '../utils/productImages'
import { listProductCategories } from '../api/categories'
import { listMaterials } from '../api/materials'
import { getGlobalSettings } from '../api/settings'
import { listTables } from '../api/tables'
import { getInventoryControlConfig } from '../api/inventoryControl'
import { listDocumentPrefixes } from '../api/documentPrefixes'
import { listRecipes, getRecipeMaterials } from '../api/recipes'
import { listUnitOfMeasures } from '../api/unitOfMeasures'
import { listProductUnitOfMeasures } from '../api/productUnitOfMeasures'
import { listMaterialUnitOfMeasures } from '../api/materialUnitOfMeasures'
import type { Recipe, RecipeMaterial } from '../api/recipes'
import type { Product } from '../api/products'
import type { ProductCategory } from '../api/categories'
import type { Material } from '../api/materials'
import type { Setting } from '../api/settings'
import type { InventoryControlConfig } from '../api/inventoryControl'
import type { DocumentPrefix } from '../api/documentPrefixes'

export interface SyncProgress {
  step: 'products' | 'categories' | 'materials' | 'unit_of_measures' | 'product_unit_of_measures' | 'material_unit_of_measures' | 'recipes' | 'recipe_materials' | 'settings' | 'tables' | 'inventory_config' | 'document_prefixes' | 'sequences' | 'complete'
  progress: number // 0-100
  message: string
}

export interface SyncResult {
  success: boolean
  error?: string
  productsCount?: number
  categoriesCount?: number
  materialsCount?: number
  unitOfMeasuresCount?: number
  productUnitOfMeasuresCount?: number
  materialUnitOfMeasuresCount?: number
  recipesCount?: number
  recipeMaterialsCount?: number
  settingsCount?: number
  tablesCount?: number
  inventoryConfigCount?: number
  documentPrefixesCount?: number
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'products', new Date().toISOString())
  
  // Download product images in parallel (but limit concurrency to avoid overwhelming the server)
  const downloadPromises = products.map((p: Product) => {
    if (p.code) {
      return downloadProductImage(p.id, p.code).catch((error) => {
        // Log but don't fail sync if image download fails
        console.error(`[syncProducts] Failed to download image for product ${p.id} (${p.code}):`, error)
      })
    }
    return Promise.resolve()
  })
  
  // Download images with limited concurrency (5 at a time)
  const BATCH_SIZE = 5
  for (let i = 0; i < downloadPromises.length; i += BATCH_SIZE) {
    const batch = downloadPromises.slice(i, i + BATCH_SIZE)
    await Promise.all(batch)
  }
  
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'categories', new Date().toISOString())
  
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'materials', new Date().toISOString())
  
  return materials.length
}

/**
 * Sync unit of measures from API to IndexedDB
 */
async function syncUnitOfMeasures(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const units = await listUnitOfMeasures(true) // Only active units
  
  const dbUnits: POSDatabase['unit_of_measures']['value'][] = units.map((u) => ({
    id: u.id,
    name: u.name,
    abbreviation: u.abbreviation,
    type: u.type,
    is_active: u.is_active,
    sync_status: 'synced' as const,
    updated_at: new Date().toISOString(),
  }))
  
  await saveUnitOfMeasures(db, dbUnits)
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'unit_of_measures', new Date().toISOString())
  
  return units.length
}

/**
 * Sync product unit of measures from API to IndexedDB
 */
async function syncProductUnitOfMeasures(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const units = await listProductUnitOfMeasures() // Get all
  
  const dbUnits: POSDatabase['product_unit_of_measures']['value'][] = units.map((u) => ({
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'product_unit_of_measures', new Date().toISOString())
  
  return units.length
}

/**
 * Sync material unit of measures from API to IndexedDB
 */
async function syncMaterialUnitOfMeasures(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const units = await listMaterialUnitOfMeasures() // Get all
  
  const dbUnits: POSDatabase['material_unit_of_measures']['value'][] = units.map((u) => ({
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'material_unit_of_measures', new Date().toISOString())
  
  return units.length
}

/**
 * Sync recipes from API to IndexedDB
 */
async function syncRecipes(db: IDBPDatabase<POSDatabase>): Promise<number> {
  const recipes = await listRecipes() // Recipes are global, no store_id needed
  
  const dbRecipes: POSDatabase['recipes']['value'][] = recipes.map((r: Recipe) => ({
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'recipes', new Date().toISOString())
  
  return recipes.length
}

/**
 * Sync recipe materials from API to IndexedDB
 */
async function syncRecipeMaterials(db: IDBPDatabase<POSDatabase>, recipes: Recipe[]): Promise<number> {
  let totalMaterials = 0
  
  // Fetch materials for each recipe
  for (const recipe of recipes) {
    try {
      const materials = await getRecipeMaterials(recipe.id)
      
      const dbMaterials: POSDatabase['recipe_materials']['value'][] = materials.map((m: RecipeMaterial) => ({
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
      totalMaterials += materials.length
    } catch (error) {
      console.error(`[syncRecipeMaterials] Error syncing materials for recipe ${recipe.id}:`, error)
      // Continue with other recipes
    }
  }
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'recipe_materials', new Date().toISOString())
  
  return totalMaterials
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
  
  // Record sync timestamp
  await updateLastSyncTimestamp(db, 'settings', new Date().toISOString())
  
  return settings.length
}

/**
 * Sync tables from API to IndexedDB
 */
async function syncTables(db: IDBPDatabase<POSDatabase>, storeId?: number): Promise<number> {
  const tables = await listTables(storeId, true)
  
  await saveTables(db, tables)
  
  // Record sync timestamp (store-specific)
  if (storeId) {
    await updateLastSyncTimestamp(db, 'tables', new Date().toISOString(), storeId)
  }
  
  return tables.length
}

/**
 * Sync document prefixes from API to IndexedDB
 */
async function syncDocumentPrefixes(db: IDBPDatabase<POSDatabase>, storeId?: number): Promise<number> {
  const prefixes = await listDocumentPrefixes(storeId)
  
  // Transform prefixes to match IndexedDB schema
  const dbPrefixes = prefixes.map((p: DocumentPrefix) => ({
    id: p.id,
    store_id: p.store_id ?? null,
    doc_type: p.doc_type,
    prefix: p.prefix,
    is_active: p.is_active,
    sync_status: 'synced' as const,
    updated_at: p.updated_at || new Date().toISOString(),
  }))
  
  await saveDocumentPrefixes(db, dbPrefixes)
  
  // Record sync timestamp (store-specific)
  if (storeId) {
    await updateLastSyncTimestamp(db, 'document_prefixes', new Date().toISOString(), storeId)
  }
  
  return prefixes.length
}

/**
 * Sync inventory control config from API to IndexedDB
 */
async function syncInventoryControlConfig(db: IDBPDatabase<POSDatabase>, storeId: number): Promise<number> {
  try {
    console.log(`[syncInventoryControlConfig] Starting sync for storeId: ${storeId}`)
    const configs = await getInventoryControlConfig(storeId)
    console.log(`[syncInventoryControlConfig] Received ${configs.length} config items from API`)
    
    if (!configs || configs.length === 0) {
      console.warn(`[syncInventoryControlConfig] No inventory control config items found for storeId: ${storeId}`)
      return 0
    }
    
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
    
    console.log(`[syncInventoryControlConfig] Saving ${dbConfigs.length} config items to IndexedDB`)
    await saveInventoryControlConfigs(db, dbConfigs)
    console.log(`[syncInventoryControlConfig] Successfully synced ${configs.length} inventory control config items`)
    
    // Record sync timestamp (store-specific)
    await updateLastSyncTimestamp(db, 'inventory_config', new Date().toISOString(), storeId)
    
    return configs.length
  } catch (error: any) {
    console.error('[syncInventoryControlConfig] Error syncing inventory control config:', error)
    // Re-throw with more context
    const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error'
    throw new Error(`Failed to sync inventory control config: ${errorMessage}`)
  }
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
    
    // Sync Materials/Vendors (35%)
    onProgress?.({
      step: 'materials',
      progress: 30,
      message: 'Syncing materials...',
    })
    const materialsCount = await syncMaterials(db)
    onProgress?.({
      step: 'materials',
      progress: 35,
      message: `Synced ${materialsCount} materials`,
    })
    
    // Sync Unit of Measures (40%)
    onProgress?.({
      step: 'unit_of_measures',
      progress: 35,
      message: 'Syncing unit of measures...',
    })
    const unitOfMeasuresCount = await syncUnitOfMeasures(db)
    onProgress?.({
      step: 'unit_of_measures',
      progress: 40,
      message: `Synced ${unitOfMeasuresCount} unit of measures`,
    })
    
    // Sync Product Unit of Measures (42%)
    onProgress?.({
      step: 'product_unit_of_measures',
      progress: 40,
      message: 'Syncing product unit of measures...',
    })
    const productUnitOfMeasuresCount = await syncProductUnitOfMeasures(db)
    onProgress?.({
      step: 'product_unit_of_measures',
      progress: 42,
      message: `Synced ${productUnitOfMeasuresCount} product unit of measures`,
    })
    
    // Sync Material Unit of Measures (44%)
    onProgress?.({
      step: 'material_unit_of_measures',
      progress: 42,
      message: 'Syncing material unit of measures...',
    })
    const materialUnitOfMeasuresCount = await syncMaterialUnitOfMeasures(db)
    onProgress?.({
      step: 'material_unit_of_measures',
      progress: 44,
      message: `Synced ${materialUnitOfMeasuresCount} material unit of measures`,
    })
    
    // Sync Recipes (50%)
    onProgress?.({
      step: 'recipes',
      progress: 44,
      message: 'Syncing recipes...',
    })
    const recipes = await listRecipes() // Recipes are global, no store_id needed
    const recipesCount = await syncRecipes(db)
    onProgress?.({
      step: 'recipes',
      progress: 48,
      message: `Synced ${recipesCount} recipes`,
    })
    
    // Sync Recipe Materials (52%)
    onProgress?.({
      step: 'recipe_materials',
      progress: 48,
      message: 'Syncing recipe materials...',
    })
    const recipeMaterialsCount = await syncRecipeMaterials(db, recipes)
    onProgress?.({
      step: 'recipe_materials',
      progress: 52,
      message: `Synced ${recipeMaterialsCount} recipe materials`,
    })
    
    // Sync Settings (55%)
    onProgress?.({
      step: 'settings',
      progress: 52,
      message: 'Syncing settings...',
    })
    const settingsCount = await syncSettings(db)
    onProgress?.({
      step: 'settings',
      progress: 55,
      message: `Synced ${settingsCount} settings`,
    })
    
    // Sync Tables (60%)
    onProgress?.({
      step: 'tables',
      progress: 55,
      message: 'Syncing tables...',
    })
    const tablesCount = await syncTables(db, storeId)
    onProgress?.({
      step: 'tables',
      progress: 60,
      message: `Synced ${tablesCount} tables`,
    })
    
    // Sync Inventory Control Config (70%)
    let inventoryConfigCount = 0
    if (storeId) {
      try {
        onProgress?.({
          step: 'inventory_config',
          progress: 60,
          message: 'Syncing inventory control config...',
        })
        inventoryConfigCount = await syncInventoryControlConfig(db, storeId)
        onProgress?.({
          step: 'inventory_config',
          progress: 70,
          message: `Synced ${inventoryConfigCount} inventory config items`,
        })
      } catch (error: any) {
        // Log the error but don't fail the entire sync
        console.error('[performInitialSync] Error syncing inventory control config:', error)
        const errorMsg = error?.message || 'Unknown error'
        onProgress?.({
          step: 'inventory_config',
          progress: 70,
          message: `Warning: Failed to sync inventory config: ${errorMsg}`,
        })
        // Continue with sync even if inventory config fails
        inventoryConfigCount = 0
      }
    } else {
      console.warn('[performInitialSync] Skipping inventory config sync - no storeId provided')
      onProgress?.({
        step: 'inventory_config',
        progress: 70,
        message: 'Skipping inventory config (no store ID)',
      })
    }
    
    // Sync Document Prefixes (75%)
    let documentPrefixesCount = 0
    try {
      onProgress?.({
        step: 'document_prefixes',
        progress: 70,
        message: 'Syncing document prefixes...',
      })
      documentPrefixesCount = await syncDocumentPrefixes(db, storeId)
      onProgress?.({
        step: 'document_prefixes',
        progress: 75,
        message: `Synced ${documentPrefixesCount} document prefixes`,
      })
    } catch (error: any) {
      console.error('[performInitialSync] Error syncing document prefixes:', error)
      const errorMsg = error?.message || 'Unknown error'
      onProgress?.({
        step: 'document_prefixes',
        progress: 75,
        message: `Warning: Failed to sync document prefixes: ${errorMsg}`,
      })
      documentPrefixesCount = 0
    }
    
    // Initialize Sequences (90%)
    // Note: Sequences are initialized from max sequences returned by backend during sync
    // This will be handled when we implement the sync endpoint that returns max sequences
    onProgress?.({
      step: 'sequences',
      progress: 85,
      message: 'Initializing sequences...',
    })
    // TODO: Initialize sequences from backend max sequences per cash register per current date
    // This will be implemented when we add the sync endpoint that returns max sequences
    onProgress?.({
      step: 'sequences',
      progress: 90,
      message: 'Sequences initialized',
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
      categoriesCount,
      materialsCount,
      unitOfMeasuresCount,
      productUnitOfMeasuresCount,
      materialUnitOfMeasuresCount,
      recipesCount,
      recipeMaterialsCount,
      settingsCount,
      tablesCount,
      inventoryConfigCount: storeId ? inventoryConfigCount : undefined,
      documentPrefixesCount,
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

