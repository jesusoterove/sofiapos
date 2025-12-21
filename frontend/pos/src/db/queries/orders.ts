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

/**
 * Get order by order_number (primary key for local operations).
 * Use this for all local order operations.
 */
export async function getOrderByOrderNumber(
  db: IDBPDatabase<POSDatabase>,
  orderNumber: string
): Promise<POSDatabase['orders']['value'] | undefined> {
  return db.get('orders', orderNumber)
}

/**
 * Get order by id (remote ID, for sync purposes only).
 * Use this only when syncing or working with remote IDs.
 */
export async function getOrderById(
  db: IDBPDatabase<POSDatabase>,
  id: string | number
): Promise<POSDatabase['orders']['value'] | undefined> {
  try {
    const index = db.transaction('orders', 'readonly').store.index('by-id')
    return await index.get(id)
  } catch (error) {
    // Fallback: get all and filter
    const allOrders = await db.getAll('orders')
    return allOrders.find((o) => String(o.id) === String(id))
  }
}

/**
 * @deprecated Use getOrderByOrderNumber for local operations.
 * This function is kept for backward compatibility but will be removed.
 */
export async function getOrder(db: IDBPDatabase<POSDatabase>, id: string) {
  // Try to get by id first (for backward compatibility)
  const byId = await getOrderById(db, id)
  if (byId) {
    return byId
  }
  // If not found by id, try as order_number (in case id was actually an order_number)
  return db.get('orders', id)
}

/**
 * Get order items by order_number (local relationship key).
 * Use this for local operations.
 * 
 * This function handles backward compatibility:
 * - First tries to get items by order_number (new way)
 * - If no items found, tries by order_id (old way) and backfills order_number
 */
export async function getOrderItemsByOrderNumber(
  db: IDBPDatabase<POSDatabase>,
  orderNumber: string
): Promise<POSDatabase['order_items']['value'][]> {
  // First, try to get by order_number (new way)
  let items = await db.getAllFromIndex('order_items', 'by-order-number', orderNumber)
  
  // If no items found, try to get by order_id (for backward compatibility with old data)
  // We need to find the order first to get its id
  if (items.length === 0) {
    const orderIndex = db.transaction('orders', 'readonly').store.index('by-order-number')
    const order = await orderIndex.get(orderNumber)
    
    if (order && order.id) {
      // Try to get items by order_id (old way)
      const itemsByOrderId = await db.getAllFromIndex('order_items', 'by-order', String(order.id))
      
      // Backfill order_number for items that don't have it
      if (itemsByOrderId.length > 0) {
        const tx = db.transaction('order_items', 'readwrite')
        const updatedItems: POSDatabase['order_items']['value'][] = []
        
        for (const item of itemsByOrderId) {
          if (!item.order_number) {
            // Update item to include order_number
            const updatedItem: POSDatabase['order_items']['value'] = {
              ...item,
              order_number: orderNumber,
            }
            await tx.store.put(updatedItem)
            updatedItems.push(updatedItem)
          } else {
            updatedItems.push(item)
          }
        }
        
        await tx.done
        items = updatedItems
      }
    }
  }
  
  return items
}

/**
 * Get order items by order_id (remote ID, for sync purposes only).
 * Use this only when syncing or working with remote IDs.
 */
export async function getOrderItemsByOrderId(
  db: IDBPDatabase<POSDatabase>,
  orderId: string | number
): Promise<POSDatabase['order_items']['value'][]> {
  return db.getAllFromIndex('order_items', 'by-order', String(orderId))
}

/**
 * @deprecated Use getOrderItemsByOrderNumber for local operations.
 * This function is kept for backward compatibility but will be removed.
 */
export async function getOrderItems(db: IDBPDatabase<POSDatabase>, orderId: string) {
  // Try to get by order_number first (local relationship)
  // If not found, fall back to order_id (for backward compatibility)
  const byOrderNumber = await db.getAllFromIndex('order_items', 'by-order-number', orderId)
  if (byOrderNumber.length > 0) {
    return byOrderNumber
  }
  return db.getAllFromIndex('order_items', 'by-order', orderId)
}

export async function saveOrder(db: IDBPDatabase<POSDatabase>, order: POSDatabase['orders']['value']) {
  return db.put('orders', order)
}

export async function saveOrderItem(db: IDBPDatabase<POSDatabase>, item: POSDatabase['order_items']['value']) {
  return db.put('order_items', item)
}

/**
 * Delete order by order_number (local relationship key).
 * This deletes the order and all its items from IndexedDB.
 */
export async function deleteOrderByOrderNumber(db: IDBPDatabase<POSDatabase>, orderNumber: string) {
  const tx = db.transaction(['orders', 'order_items'], 'readwrite')
  
  // Delete order using order_number as primary key
  await tx.objectStore('orders').delete(orderNumber)
  
  // Delete all order items by order_number
  const items = await tx.objectStore('order_items').index('by-order-number').getAll(orderNumber)
  await Promise.all(items.map((item) => tx.objectStore('order_items').delete(item.id as any)))
  await tx.done
}

/**
 * @deprecated Use deleteOrderByOrderNumber for local operations.
 * This function is kept for backward compatibility but will be removed.
 */
export async function deleteOrder(db: IDBPDatabase<POSDatabase>, orderId: string) {
  const tx = db.transaction(['orders', 'order_items'], 'readwrite')
  await tx.objectStore('orders').delete(orderId)
  const items = await tx.objectStore('order_items').index('by-order').getAll(orderId)
  await Promise.all(items.map((item) => tx.objectStore('order_items').delete(item.id as any)))
  await tx.done
}

