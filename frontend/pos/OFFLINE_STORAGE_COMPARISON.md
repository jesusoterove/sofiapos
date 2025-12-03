# Offline Storage Comparison: IndexedDB vs SQLite

## ⚠️ MVP Scale Update

**For MVP (First Release) with ~100 products and 20-30 items per order:**
- **Recommendation: IndexedDB** ✅
- See `MVP_STORAGE_RECOMMENDATION.md` for detailed MVP analysis

**For larger scale (1000+ products, 100+ items per order):**
- **Recommendation: SQLite** ✅
- See details below

---

## Executive Summary (For Larger Scale)

For the SofiaPOS application at larger scale, **SQLite is recommended** for the following reasons:
1. Complex relational queries (orders with items, products with categories, etc.)
2. Better performance for joins and aggregations
3. Familiar SQL syntax (matches backend PostgreSQL/MySQL)
4. Stronger transaction support for financial operations
5. Better data integrity guarantees

However, the choice depends on the deployment target:
- **Web/PWA**: Use **sql.js** (SQLite compiled to WebAssembly)
- **Desktop (Electron)**: Use **better-sqlite3** or **sql.js**
- **Mobile (React Native)**: Use **react-native-sqlite-storage**

## Detailed Comparison

### IndexedDB

#### Pros
- ✅ **Native Browser API**: No additional dependencies
- ✅ **Large Storage**: Can store GBs of data
- ✅ **Asynchronous**: Non-blocking operations
- ✅ **Works Everywhere**: All modern browsers support it
- ✅ **Service Worker Compatible**: Works with PWA offline features
- ✅ **No Build Complexity**: Works out of the box
- ✅ **Good for Simple Queries**: Fast for key-value lookups

#### Cons
- ❌ **No SQL**: Must write JavaScript queries
- ❌ **Complex Joins**: Difficult and slow for relational queries
- ❌ **No Transactions**: Limited transaction support
- ❌ **Indexing**: Manual index management
- ❌ **Query Performance**: Slower for complex queries
- ❌ **Learning Curve**: Different API than SQL databases
- ❌ **Data Integrity**: Less robust than SQL databases

#### Example Query Complexity

**IndexedDB - Get order with items:**
```javascript
// Multiple async operations needed
const order = await getOrder(orderId);
const items = await getOrderItems(orderId);
// Manual join in JavaScript
order.items = items;
```

**SQLite - Get order with items:**
```sql
-- Single query with join
SELECT o.*, oi.* 
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
WHERE o.id = ?
```

### SQLite

#### Pros
- ✅ **SQL Queries**: Familiar SQL syntax
- ✅ **Complex Joins**: Efficient relational queries
- ✅ **Transactions**: ACID compliance
- ✅ **Performance**: Optimized for complex queries
- ✅ **Data Integrity**: Foreign keys, constraints, triggers
- ✅ **Backend Consistency**: Same SQL concepts as PostgreSQL/MySQL
- ✅ **Aggregations**: Built-in SUM, COUNT, GROUP BY, etc.
- ✅ **Indexes**: Automatic index optimization
- ✅ **Migrations**: Can use similar migration patterns

#### Cons
- ❌ **Additional Dependency**: Requires sql.js or native wrapper
- ❌ **Bundle Size**: sql.js adds ~2MB to bundle
- ❌ **WebAssembly**: Requires WASM support (all modern browsers)
- ❌ **Synchronous API**: sql.js uses synchronous API (can block)
- ❌ **Setup Complexity**: More initial setup required

#### Implementation Options

**1. sql.js (Web/PWA)**
- SQLite compiled to WebAssembly
- Runs entirely in browser
- Synchronous API (can use Web Workers)
- ~2MB bundle size
- Works with all modern browsers

**2. better-sqlite3 (Electron Desktop)**
- Native SQLite binding
- Best performance
- Synchronous API
- Requires native compilation
- Only works in Electron/Node.js

**3. react-native-sqlite-storage (Mobile)**
- Native SQLite for React Native
- Full SQL support
- Good performance
- Platform-specific implementation

## POS Application Requirements Analysis

### Data Complexity

The POS needs to handle:
1. **Products** with categories, tags, images, prices
2. **Orders** with multiple items, customer, taxes, discounts
3. **Inventory** transactions with materials/products
4. **Shifts** with users, cash registers
5. **Tables** with orders
6. **Customers** with order history
7. **Payments** linked to orders

### Query Patterns Needed

1. **Product Search**: Filter by category, search by name, filter by availability
   ```sql
   SELECT * FROM products 
   WHERE category_id = ? AND name LIKE ? AND is_active = 1
   ```

2. **Order with Items**: Get order and all items in one query
   ```sql
   SELECT o.*, oi.*, p.name as product_name
   FROM orders o
   LEFT JOIN order_items oi ON o.id = oi.order_id
   LEFT JOIN products p ON oi.product_id = p.id
   WHERE o.id = ?
   ```

3. **Sales Reports**: Aggregate sales by product, category, date
   ```sql
   SELECT p.category_id, SUM(oi.total) as total_sales
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   JOIN products p ON oi.product_id = p.id
   WHERE o.status = 'paid' AND o.created_at BETWEEN ? AND ?
   GROUP BY p.category_id
   ```

4. **Inventory Queries**: Check stock levels, filter by material/product
   ```sql
   SELECT m.name, SUM(it.quantity) as total_stock
   FROM inventory_transactions it
   JOIN materials m ON it.material_id = m.id
   WHERE it.entry_type = 'purchase'
   GROUP BY m.id
   ```

### Performance Requirements

- **Product Search**: < 100ms for 1000+ products
- **Order Loading**: < 200ms for orders with 50+ items
- **Real-time Calculations**: Instant order total updates
- **Sync Operations**: Efficient batch inserts/updates

## Recommendation: SQLite with sql.js

### Why SQLite for POS?

1. **Complex Queries**: POS needs efficient joins (orders + items + products)
2. **Data Integrity**: Financial transactions require ACID compliance
3. **Performance**: Faster for aggregations and reports
4. **Consistency**: Same SQL concepts as backend
5. **Future-Proof**: Easier to migrate to native SQLite if needed

### Implementation Strategy

#### Option 1: sql.js (Recommended for Web/PWA)

```typescript
// Setup sql.js
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
  locateFile: (file) => `https://sql.js.org/dist/${file}`
});

const db = new SQL.Database();

// Create tables (mirror backend schema)
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    store_id INTEGER,
    name TEXT,
    code TEXT,
    selling_price REAL,
    ...
  );
`);

// Query example
const stmt = db.prepare(`
  SELECT o.*, oi.*, p.name as product_name
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE o.id = ?
`);
stmt.bind([orderId]);
const results = [];
while (stmt.step()) {
  results.push(stmt.getAsObject());
}
stmt.free();
```

**Pros:**
- Works in browser (PWA)
- Full SQL support
- Can use Web Workers for async operations
- Same schema as backend

**Cons:**
- ~2MB bundle size
- Synchronous API (use Web Workers)
- Requires WASM support

#### Option 2: Hybrid Approach (Best of Both Worlds)

Use **SQLite for complex data** and **IndexedDB for simple key-value**:

- **SQLite**: Orders, Products, Inventory, Customers (relational data)
- **IndexedDB**: Cache, sync queue, settings, user preferences

```typescript
// SQLite for relational data
const order = await sqlite.query(`
  SELECT o.*, oi.* FROM orders o 
  LEFT JOIN order_items oi ON o.id = oi.order_id 
  WHERE o.id = ?
`);

// IndexedDB for simple cache
await indexedDB.put('product-cache', productId, productData);
```

### Migration Path

1. **Phase 1**: Start with sql.js for core data
2. **Phase 2**: Optimize with Web Workers for async
3. **Phase 3**: If Electron desktop needed, migrate to better-sqlite3

## Performance Comparison

### Test Scenario: Load order with 50 items

**IndexedDB:**
```javascript
// Multiple async calls
const order = await getOrder(id);           // ~50ms
const items = await getOrderItems(id);     // ~80ms
const products = await getProducts(items.map(i => i.productId)); // ~120ms
// Manual join in JavaScript                // ~20ms
// Total: ~270ms
```

**SQLite:**
```sql
-- Single query with joins
SELECT o.*, oi.*, p.name, p.selling_price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.id = ?
-- Total: ~30ms
```

## Bundle Size Impact

- **IndexedDB**: 0KB (native API)
- **sql.js**: ~2MB (compressed ~600KB)
- **better-sqlite3**: ~5MB (native, Electron only)

For a POS application, 2MB is acceptable given the benefits.

## Final Recommendation

### Use SQLite (sql.js) because:

1. ✅ **Complex Queries**: POS needs efficient relational queries
2. ✅ **Data Integrity**: Financial operations need ACID compliance
3. ✅ **Performance**: Faster for joins and aggregations
4. ✅ **Consistency**: Same SQL concepts as backend
5. ✅ **Maintainability**: Easier to maintain SQL than IndexedDB queries
6. ✅ **Future-Proof**: Can migrate to native SQLite if needed

### Implementation Notes:

1. **Use Web Workers**: Run sql.js in Web Worker to avoid blocking UI
2. **Schema Sync**: Mirror backend schema in SQLite
3. **Migration Strategy**: Use similar migration approach as backend
4. **Sync Queue**: Use IndexedDB for sync queue (simple key-value)
5. **Caching**: Use IndexedDB for product images cache

### Code Structure:

```
src/
├── db/
│   ├── sqlite.ts          # SQLite setup and queries
│   ├── schema.ts          # Database schema (mirrors backend)
│   ├── migrations/        # Database migrations
│   └── queries/           # Query functions
│       ├── products.ts
│       ├── orders.ts
│       └── inventory.ts
├── sync/
│   ├── syncQueue.ts       # IndexedDB for sync queue
│   └── syncManager.ts     # Sync logic
└── cache/
    └── imageCache.ts      # IndexedDB for image cache
```

## Conclusion

**SQLite (sql.js) is the better choice** for SofiaPOS because:
- Handles complex relational queries efficiently
- Provides data integrity for financial operations
- Maintains consistency with backend database
- Better performance for POS operations
- Easier to maintain and extend

The 2MB bundle size is acceptable for the benefits gained, especially for a POS application that needs reliable offline functionality.

