export { openDatabase, clearAllData } from './sqlite'

export { getAllProducts, getProductsByCategory, searchProducts, saveProducts, getProductCount } from './queries/products'
export type { DBProduct } from './queries/products'

export { getAllCategories, saveCategories } from './queries/categories'
export type { DBCategory } from './queries/categories'

export { saveOrder, saveOrderItem, getOrderItemsByOrderNumber, getOrdersByStatus, getDraftOrders } from './queries/orders'
export type { DBOrder, DBOrderItem } from './queries/orders'

export { getOpenShift, saveShift } from './queries/shifts'
export type { DBShift } from './queries/shifts'

export { getAllTables, saveTables } from './queries/tables'
export type { DBTable } from './queries/tables'

export { addToSyncQueue, getSyncQueue, removeFromSyncQueue, incrementRetryCount, getSyncQueueCount } from './queries/syncQueue'
export type { DBSyncQueueItem } from './queries/syncQueue'

export { getLastSyncTimestamp, updateLastSyncTimestamp } from './queries/syncState'
