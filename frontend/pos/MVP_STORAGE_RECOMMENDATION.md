# MVP Storage Recommendation: IndexedDB

## Context

For the **first release (MVP)** with:
- **Max 100 products**
- **Orders with max 20-30 items**
- **Limited complexity**

## Updated Recommendation: **IndexedDB**

### Why IndexedDB for MVP?

1. ✅ **Simpler Implementation**
   - No additional dependencies
   - Native browser API
   - Faster to implement and test

2. ✅ **Smaller Bundle Size**
   - 0KB vs 2MB (sql.js)
   - Faster initial load
   - Better for mobile/web

3. ✅ **Performance is Sufficient**
   - At this scale, performance difference is negligible
   - 100 products: IndexedDB search < 50ms
   - 20-30 order items: Loading < 100ms

4. ✅ **Easier to Maintain**
   - Less code complexity
   - No Web Workers needed
   - Simpler debugging

5. ✅ **Future-Proof**
   - Can migrate to SQLite later if needed
   - Data structure can be designed for easy migration

### Performance Comparison at MVP Scale

#### Loading Order with 20 Items

**IndexedDB:**
```javascript
// Sequential async calls
const order = await getOrder(id);           // ~20ms (100 orders)
const items = await getOrderItems(id);     // ~30ms (20 items)
const products = await getProducts(...);   // ~40ms (100 products)
// Manual join                                    // ~10ms
// Total: ~100ms ✅ Acceptable
```

**SQLite:**
```sql
-- Single query
SELECT o.*, oi.*, p.name 
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.id = ?
-- Total: ~30ms ✅ Faster, but difference is minimal
```

**Verdict**: At MVP scale, the 70ms difference is negligible for user experience.

#### Product Search (100 products)

**IndexedDB:**
```javascript
// Filter in memory
const products = await getAllProducts();
const filtered = products.filter(p => 
  p.name.includes(query) && p.categoryId === categoryId
);
// Total: ~30ms ✅ Fast enough
```

**SQLite:**
```sql
SELECT * FROM products 
WHERE name LIKE ? AND category_id = ?
-- Total: ~15ms ✅ Faster, but difference is minimal
```

**Verdict**: Both are fast enough at this scale.

## IndexedDB Implementation for MVP

### Data Structure Design

```typescript
// Simple, flat structure optimized for MVP
interface Product {
  id: number;
  storeId: number;
  name: string;
  code?: string;
  description?: string;
  categoryId?: number;
  sellingPrice: number;
  requiresInventory: boolean;
  isActive: boolean;
  isTopSelling: boolean;
  // Denormalized for faster queries
  categoryName?: string;
}

interface Order {
  id: number;
  storeId: number;
  orderNumber: string;
  status: 'draft' | 'open' | 'paid' | 'cancelled';
  customerId?: number;
  items: OrderItem[]; // Embedded for MVP
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  syncStatus: 'synced' | 'pending';
}

interface OrderItem {
  id: number;
  productId: number;
  productName: string; // Denormalized
  quantity: number;
  unitPrice: number;
  total: number;
}
```

### IndexedDB Setup

```typescript
// src/db/indexeddb.ts
const DB_NAME = 'sofiapos';
const DB_VERSION = 1;

const stores = {
  products: 'id, storeId, categoryId, code, name',
  orders: 'id, storeId, orderNumber, status, syncStatus, createdAt',
  orderItems: 'id, orderId, productId',
  customers: 'id, name, email, phone',
  categories: 'id, name',
  syncQueue: 'id, type, action, dataId, createdAt',
};

export async function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      Object.entries(stores).forEach(([storeName, indexes]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { 
            keyPath: 'id',
            autoIncrement: storeName !== 'products' && storeName !== 'customers'
          });
          
          // Create indexes
          indexes.split(', ').forEach(index => {
            const [name, ...keyPath] = index.split(' ');
            store.createIndex(name, keyPath.join(' ') || name, { unique: false });
          });
        }
      });
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}
```

### Query Functions

```typescript
// src/db/queries/products.ts
export async function getProducts(filters: {
  storeId: number;
  categoryId?: number;
  search?: string;
  isActive?: boolean;
}): Promise<Product[]> {
  const db = await initDatabase();
  const transaction = db.transaction(['products'], 'readonly');
  const store = transaction.objectStore('products');
  
  return new Promise((resolve, reject) => {
    const products: Product[] = [];
    const index = store.index('storeId');
    const request = index.getAll(filters.storeId);
    
    request.onsuccess = () => {
      let filtered = request.result;
      
      // Filter in memory (fast enough for 100 products)
      if (filters.categoryId) {
        filtered = filtered.filter(p => p.categoryId === filters.categoryId);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.code?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.isActive !== undefined) {
        filtered = filtered.filter(p => p.isActive === filters.isActive);
      }
      
      resolve(filtered);
    };
    
    request.onerror = reject;
  });
}

// src/db/queries/orders.ts
export async function getOrderWithItems(orderId: number): Promise<Order | null> {
  const db = await initDatabase();
  const transaction = db.transaction(['orders', 'orderItems'], 'readonly');
  const orderStore = transaction.objectStore('orders');
  const itemStore = transaction.objectStore('orderItems');
  
  return new Promise((resolve, reject) => {
    // Get order
    const orderRequest = orderStore.get(orderId);
    
    orderRequest.onsuccess = async () => {
      const order = orderRequest.result;
      if (!order) {
        resolve(null);
        return;
      }
      
      // Get items
      const itemIndex = itemStore.index('orderId');
      const itemsRequest = itemIndex.getAll(orderId);
      
      itemsRequest.onsuccess = () => {
        order.items = itemsRequest.result;
        resolve(order);
      };
      
      itemsRequest.onerror = reject;
    };
    
    orderRequest.onerror = reject;
  });
}

export async function createOrder(order: Order): Promise<number> {
  const db = await initDatabase();
  const transaction = db.transaction(['orders', 'orderItems'], 'readwrite');
  const orderStore = transaction.objectStore('orders');
  const itemStore = transaction.objectStore('orderItems');
  
  return new Promise((resolve, reject) => {
    // Add order
    const orderRequest = orderStore.add({
      ...order,
      syncStatus: 'pending',
    });
    
    orderRequest.onsuccess = () => {
      const orderId = orderRequest.result as number;
      
      // Add items
      order.items.forEach((item, index) => {
        itemStore.add({
          ...item,
          orderId,
          id: undefined, // Let auto-increment handle it
        });
      });
      
      // Add to sync queue
      addToSyncQueue({
        type: 'order',
        action: 'create',
        dataId: orderId,
      });
      
      resolve(orderId);
    };
    
    orderRequest.onerror = reject;
  });
}
```

## Migration Path to SQLite (When Needed)

When you scale beyond MVP (e.g., 1000+ products, 100+ items per order), you can migrate:

1. **Export Data**: Export all IndexedDB data to JSON
2. **Import to SQLite**: Import JSON into SQLite schema
3. **Update Queries**: Replace IndexedDB queries with SQL queries
4. **Test**: Verify all functionality works

The data structure can be designed to make this migration straightforward.

## Recommendation Summary

### For MVP (First Release): **IndexedDB** ✅

**Reasons:**
- ✅ Simpler implementation (faster to ship)
- ✅ No dependencies (smaller bundle)
- ✅ Performance is sufficient at this scale
- ✅ Easier to maintain and debug
- ✅ Can migrate to SQLite later if needed

### When to Consider SQLite:

- **Scale**: 1000+ products, 100+ items per order
- **Complex Queries**: Advanced reporting, analytics
- **Performance Issues**: If IndexedDB becomes slow
- **Future Features**: Complex inventory calculations, advanced reports

## Implementation Priority

1. **Phase 1 (MVP)**: IndexedDB with simple queries
2. **Phase 2 (If Needed)**: Optimize IndexedDB queries
3. **Phase 3 (Scale)**: Migrate to SQLite if performance becomes an issue

## Conclusion

For your first release with 100 products and 20-30 item orders, **IndexedDB is the better choice**. It's simpler, faster to implement, and performs well at this scale. You can always migrate to SQLite later if you need the additional performance and query capabilities.

