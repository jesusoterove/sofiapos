/**
 * Product queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function getAllProducts(db: IDBPDatabase<POSDatabase>, categoryId?: number) {
  if (categoryId) {
    return db.getAllFromIndex('products', 'by-category', categoryId)
  }
  return db.getAll('products')
}

export async function getProduct(db: IDBPDatabase<POSDatabase>, id: number) {
  return db.get('products', id)
}

export async function getProductByCode(db: IDBPDatabase<POSDatabase>, code: string) {
  return db.getFromIndex('products', 'by-code', code)
}

export async function searchProducts(db: IDBPDatabase<POSDatabase>, query: string) {
  const allProducts = await db.getAll('products')
  const lowerQuery = query.toLowerCase()
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.code.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
  )
}

export async function saveProduct(db: IDBPDatabase<POSDatabase>, product: POSDatabase['products']['value']) {
  return db.put('products', product)
}

export async function saveProducts(db: IDBPDatabase<POSDatabase>, products: POSDatabase['products']['value'][]) {
  const tx = db.transaction('products', 'readwrite')
  await Promise.all(products.map((p) => tx.store.put(p)))
  await tx.done
}

