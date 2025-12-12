/**
 * Inventory control config queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function getAllInventoryControlConfig(db: IDBPDatabase<POSDatabase>, showInInventory?: boolean) {
  const allConfigs = await db.getAll('inventory_control_config')
  
  if (showInInventory !== undefined) {
    // Filter in memory since IndexedDB boolean indexes may not work reliably with getAllFromIndex
    return allConfigs.filter((config) => config.show_in_inventory === showInInventory)
  }
  
  return allConfigs
}

export async function getInventoryControlConfig(db: IDBPDatabase<POSDatabase>, id: number) {
  return db.get('inventory_control_config', id)
}

export async function saveInventoryControlConfig(db: IDBPDatabase<POSDatabase>, config: POSDatabase['inventory_control_config']['value']) {
  return db.put('inventory_control_config', config)
}

export async function saveInventoryControlConfigs(db: IDBPDatabase<POSDatabase>, configs: POSDatabase['inventory_control_config']['value'][]) {
  const tx = db.transaction('inventory_control_config', 'readwrite')
  await Promise.all(configs.map((c) => tx.store.put(c)))
  await tx.done
}

