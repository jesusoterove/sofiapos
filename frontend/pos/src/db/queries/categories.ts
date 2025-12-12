/**
 * Category queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function getAllCategories(db: IDBPDatabase<POSDatabase>) {
  return db.getAll('categories')
}

export async function getCategory(db: IDBPDatabase<POSDatabase>, id: number) {
  return db.get('categories', id)
}

export async function saveCategory(db: IDBPDatabase<POSDatabase>, category: POSDatabase['categories']['value']) {
  return db.put('categories', category)
}

export async function saveCategories(db: IDBPDatabase<POSDatabase>, categories: POSDatabase['categories']['value'][]) {
  const tx = db.transaction('categories', 'readwrite')
  await Promise.all(categories.map((c) => tx.store.put(c)))
  await tx.done
}

