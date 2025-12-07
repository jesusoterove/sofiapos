/**
 * Order queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function getAllOrders(db: IDBPDatabase<POSDatabase>, status?: string) {
  if (status) {
    return db.getAllFromIndex('orders', 'by-status', status)
  }
  return db.getAll('orders')
}

export async function getOrder(db: IDBPDatabase<POSDatabase>, id: string) {
  return db.get('orders', id)
}

export async function getOrderItems(db: IDBPDatabase<POSDatabase>, orderId: string) {
  return db.getAllFromIndex('order_items', 'by-order', orderId)
}

export async function saveOrder(db: IDBPDatabase<POSDatabase>, order: POSDatabase['orders']['value']) {
  return db.put('orders', order)
}

export async function saveOrderItem(db: IDBPDatabase<POSDatabase>, item: POSDatabase['order_items']['value']) {
  return db.put('order_items', item)
}

export async function deleteOrder(db: IDBPDatabase<POSDatabase>, orderId: string) {
  const tx = db.transaction(['orders', 'order_items'], 'readwrite')
  await tx.objectStore('orders').delete(orderId)
  const items = await tx.objectStore('order_items').index('by-order').getAll(orderId)
  await Promise.all(items.map((item) => tx.objectStore('order_items').delete(item.id)))
  await tx.done
}

