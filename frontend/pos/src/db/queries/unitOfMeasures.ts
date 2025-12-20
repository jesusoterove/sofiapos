/**
 * Unit of measure queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function saveUnitOfMeasures(
  db: IDBPDatabase<POSDatabase>,
  units: POSDatabase['unit_of_measures']['value'][]
): Promise<void> {
  const tx = db.transaction('unit_of_measures', 'readwrite')
  await Promise.all(units.map((unit) => tx.store.put(unit)))
  await tx.done
}

export async function saveProductUnitOfMeasures(
  db: IDBPDatabase<POSDatabase>,
  units: POSDatabase['product_unit_of_measures']['value'][]
): Promise<void> {
  const tx = db.transaction('product_unit_of_measures', 'readwrite')
  await Promise.all(units.map((unit) => tx.store.put(unit)))
  await tx.done
}

export async function saveMaterialUnitOfMeasures(
  db: IDBPDatabase<POSDatabase>,
  units: POSDatabase['material_unit_of_measures']['value'][]
): Promise<void> {
  const tx = db.transaction('material_unit_of_measures', 'readwrite')
  await Promise.all(units.map((unit) => tx.store.put(unit)))
  await tx.done
}

