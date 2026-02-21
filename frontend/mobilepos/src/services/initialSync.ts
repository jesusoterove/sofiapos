import { openDatabase } from '@/db'
import { saveProducts } from '@/db/queries/products'
import { saveCategories } from '@/db/queries/categories'
import { saveTables } from '@/db/queries/tables'
import { updateLastSyncTimestamp } from '@/db/queries/syncState'
import { listProducts, type Product } from '@/api/products'
import { listProductCategories, type ProductCategory } from '@/api/categories'
import { listMaterials, type Material } from '@/api/materials'
import { getGlobalSettings, type Setting } from '@/api/settings'
import { listTables } from '@/api/tables'
import { listUnitOfMeasures, listProductUnitOfMeasures, listMaterialUnitOfMeasures } from '@/api/unitOfMeasures'
import { listRecipes, getRecipeMaterials } from '@/api/recipes'
import { getInventoryControlConfig } from '@/api/inventoryControl'
import { listDocumentPrefixes } from '@/api/documentPrefixes'
import { setSecure, SECURE_KEYS } from '@/utils/secureStorage'
import type { SQLiteDatabase } from 'expo-sqlite'

export interface SyncProgress {
  step: string
  progress: number
  message: string
}

export interface SyncResult {
  success: boolean
  error?: string
  productsCount?: number
  categoriesCount?: number
}

async function syncProducts(db: SQLiteDatabase): Promise<number> {
  const products = await listProducts(true)
  const dbProducts = products.map((p: Product) => ({
    id: p.id, code: p.code || '', name: p.name, description: p.description ?? null,
    selling_price: p.selling_price, product_type: p.product_type,
    category_id: p.category_id ?? null, is_active: p.is_active ? 1 : 0,
    tax_rate: p.tax_rate || 0, sync_status: 'synced', updated_at: p.updated_at || new Date().toISOString(),
  }))
  await saveProducts(db, dbProducts)
  await updateLastSyncTimestamp(db, 'products', new Date().toISOString())
  return products.length
}

async function syncCategories(db: SQLiteDatabase): Promise<number> {
  const categories = await listProductCategories(true)
  const dbCategories = categories.map((c: ProductCategory) => ({
    id: c.id, name: c.name, description: c.description ?? null,
    sync_status: 'synced', updated_at: c.updated_at || new Date().toISOString(),
  }))
  await saveCategories(db, dbCategories)
  await updateLastSyncTimestamp(db, 'categories', new Date().toISOString())
  return categories.length
}

async function syncMaterials(db: SQLiteDatabase): Promise<number> {
  const materials = await listMaterials()
  for (const m of materials) {
    await db.runAsync(
      `INSERT OR REPLACE INTO materials (id, name, description, unit_of_measure_id, unit_cost, vendor_id, is_active, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [m.id, m.name, m.description ?? null, m.unit_of_measure_id ?? null, m.unit_cost ?? null, m.vendor_id ?? null, m.is_active !== false ? 1 : 0, m.updated_at || new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'materials', new Date().toISOString())
  return materials.length
}

async function syncUnitOfMeasures(db: SQLiteDatabase): Promise<number> {
  const units = await listUnitOfMeasures(true)
  for (const u of units) {
    await db.runAsync(
      `INSERT OR REPLACE INTO unit_of_measures (id, name, abbreviation, type, is_active, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, 'synced', ?)`,
      [u.id, u.name, u.abbreviation, u.type, u.is_active ? 1 : 0, new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'unit_of_measures', new Date().toISOString())
  return units.length
}

async function syncProductUnitOfMeasures(db: SQLiteDatabase): Promise<number> {
  const units = await listProductUnitOfMeasures()
  for (const u of units) {
    await db.runAsync(
      `INSERT OR REPLACE INTO product_unit_of_measures (id, product_id, unit_of_measure_id, conversion_factor, is_base_unit, display_order, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [u.id, u.product_id, u.unit_of_measure_id, u.conversion_factor, u.is_base_unit ? 1 : 0, u.display_order, new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'product_unit_of_measures', new Date().toISOString())
  return units.length
}

async function syncMaterialUnitOfMeasures(db: SQLiteDatabase): Promise<number> {
  const units = await listMaterialUnitOfMeasures()
  for (const u of units) {
    await db.runAsync(
      `INSERT OR REPLACE INTO material_unit_of_measures (id, material_id, unit_of_measure_id, conversion_factor, is_base_unit, display_order, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [u.id, u.material_id, u.unit_of_measure_id, u.conversion_factor, u.is_base_unit ? 1 : 0, u.display_order, new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'material_unit_of_measures', new Date().toISOString())
  return units.length
}

async function syncRecipes(db: SQLiteDatabase): Promise<number> {
  const recipes = await listRecipes()
  for (const r of recipes) {
    await db.runAsync(
      `INSERT OR REPLACE INTO recipes (id, product_id, name, description, yield_quantity, yield_unit_of_measure_id, is_active, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [r.id, r.product_id, r.name, r.description ?? null, r.yield_quantity, r.yield_unit_of_measure_id ?? null, r.is_active ? 1 : 0, r.updated_at || new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'recipes', new Date().toISOString())

  let totalMaterials = 0
  for (const recipe of recipes) {
    try {
      const materials = await getRecipeMaterials(recipe.id)
      for (const m of materials) {
        await db.runAsync(
          `INSERT OR REPLACE INTO recipe_materials (id, recipe_id, material_id, quantity, unit_of_measure_id, display_order, sync_status, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
          [m.id, m.recipe_id, m.material_id, m.quantity, m.unit_of_measure_id ?? null, m.display_order, m.updated_at || new Date().toISOString()]
        )
      }
      totalMaterials += materials.length
    } catch (e) {
      console.error(`Failed to sync materials for recipe ${recipe.id}:`, e)
    }
  }
  await updateLastSyncTimestamp(db, 'recipe_materials', new Date().toISOString())
  return recipes.length
}

async function syncSettings(db: SQLiteDatabase): Promise<number> {
  const settings = await getGlobalSettings()
  for (const s of settings) {
    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value, store_id, updated_at) VALUES (?, ?, ?, ?)`,
      [s.key, typeof s.value === 'string' ? s.value : JSON.stringify(s.value), s.store_id ?? null, new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'settings', new Date().toISOString())
  return settings.length
}

async function syncTables(db: SQLiteDatabase, storeId?: number): Promise<number> {
  const tables = await listTables(storeId, true)
  await saveTables(db, tables.map((t: any) => ({
    ...t, is_active: t.is_active ? 1 : 0, sync_status: 'synced',
    created_at: t.created_at || new Date().toISOString(),
  })))
  if (storeId) await updateLastSyncTimestamp(db, 'tables', new Date().toISOString(), storeId)
  return tables.length
}

async function syncInventoryConfig(db: SQLiteDatabase, storeId: number): Promise<number> {
  const configs = await getInventoryControlConfig(storeId)
  for (const c of configs) {
    await db.runAsync(
      `INSERT OR REPLACE INTO inventory_control_config (id, item_type, product_id, material_id, show_in_inventory, priority, uofm1_id, uofm2_id, uofm3_id, product_name, material_name, uofm1_abbreviation, uofm2_abbreviation, uofm3_abbreviation, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [c.id, c.item_type, c.product_id ?? null, c.material_id ?? null, c.show_in_inventory ? 1 : 0, c.priority, c.uofm1_id ?? null, c.uofm2_id ?? null, c.uofm3_id ?? null, c.product_name ?? null, c.material_name ?? null, c.uofm1_abbreviation ?? null, c.uofm2_abbreviation ?? null, c.uofm3_abbreviation ?? null, new Date().toISOString()]
    )
  }
  await updateLastSyncTimestamp(db, 'inventory_config', new Date().toISOString(), storeId)
  return configs.length
}

async function syncDocumentPrefixes(db: SQLiteDatabase, storeId?: number): Promise<number> {
  const prefixes = await listDocumentPrefixes(storeId)
  for (const p of prefixes) {
    await db.runAsync(
      `INSERT OR REPLACE INTO document_prefixes (id, store_id, doc_type, prefix, is_active, sync_status, updated_at)
       VALUES (?, ?, ?, ?, ?, 'synced', ?)`,
      [p.id, p.store_id ?? null, p.doc_type, p.prefix, p.is_active ? 1 : 0, p.updated_at || new Date().toISOString()]
    )
  }
  if (storeId) await updateLastSyncTimestamp(db, 'document_prefixes', new Date().toISOString(), storeId)
  return prefixes.length
}

export async function performInitialSync(
  onProgress?: (progress: SyncProgress) => void,
  storeId?: number,
  token?: string
): Promise<SyncResult> {
  try {
    if (token) {
      await setSecure(SECURE_KEYS.AUTH_TOKEN, token)
    }

    const db = await openDatabase()

    const steps = [
      { key: 'products', pct: 15, fn: () => syncProducts(db) },
      { key: 'categories', pct: 25, fn: () => syncCategories(db) },
      { key: 'materials', pct: 35, fn: () => syncMaterials(db) },
      { key: 'unit_of_measures', pct: 42, fn: () => syncUnitOfMeasures(db) },
      { key: 'product_uom', pct: 46, fn: () => syncProductUnitOfMeasures(db) },
      { key: 'material_uom', pct: 50, fn: () => syncMaterialUnitOfMeasures(db) },
      { key: 'recipes', pct: 58, fn: () => syncRecipes(db) },
      { key: 'settings', pct: 65, fn: () => syncSettings(db) },
      { key: 'tables', pct: 72, fn: () => syncTables(db, storeId) },
      { key: 'inventory_config', pct: 82, fn: storeId ? () => syncInventoryConfig(db, storeId) : null },
      { key: 'document_prefixes', pct: 90, fn: () => syncDocumentPrefixes(db, storeId) },
    ]

    let productsCount = 0
    let categoriesCount = 0

    for (const step of steps) {
      if (!step.fn) continue
      onProgress?.({ step: step.key, progress: step.pct - 10, message: `Syncing ${step.key.replace(/_/g, ' ')}...` })
      try {
        const count = await step.fn()
        if (step.key === 'products') productsCount = count
        if (step.key === 'categories') categoriesCount = count
        onProgress?.({ step: step.key, progress: step.pct, message: `Synced ${count} ${step.key.replace(/_/g, ' ')}` })
      } catch (e: any) {
        console.error(`[initialSync] Error syncing ${step.key}:`, e)
        onProgress?.({ step: step.key, progress: step.pct, message: `Warning: ${step.key} sync failed` })
      }
    }

    onProgress?.({ step: 'complete', progress: 100, message: 'Sync complete!' })
    return { success: true, productsCount, categoriesCount }
  } catch (error: any) {
    const msg = error?.message || 'Unknown error'
    onProgress?.({ step: 'error', progress: 0, message: `Sync failed: ${msg}` })
    return { success: false, error: msg }
  }
}

export async function hasCompletedInitialSync(): Promise<boolean> {
  try {
    const db = await openDatabase()
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products')
    return (row?.count ?? 0) > 0
  } catch {
    return false
  }
}
