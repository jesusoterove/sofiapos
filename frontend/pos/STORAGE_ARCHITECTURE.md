# POS Storage Architecture

## Overview

The POS application uses a **hybrid storage approach** combining SQLite and IndexedDB to optimize for both complex relational queries and simple key-value operations.

## Storage Strategy

### SQLite (sql.js) - Primary Storage

**Purpose**: Store all relational data that requires complex queries

**Data Stored**:
- Products (with categories, tags, images)
- Orders (with items, customer, payments)
- Inventory entries and transactions
- Customers
- Materials
- Recipes
- Shifts
- Cash registers
- Tables

**Why SQLite**:
- Efficient joins (orders + items + products)
- Complex queries (search, filter, aggregate)
- ACID transactions for financial operations
- Same SQL concepts as backend
- Better performance for relational data

### IndexedDB - Secondary Storage

**Purpose**: Store simple key-value data and cache

**Data Stored**:
- Sync queue (pending operations)
- Product image cache
- User preferences
- Settings
- Session data

**Why IndexedDB**:
- Simple key-value operations
- Fast lookups
- Native browser API
- Good for caching

## Database Schema

### SQLite Schema (Mirrors Backend)

The SQLite schema mirrors the backend PostgreSQL/MySQL schema:

```sql
-- Products
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category_id INTEGER,
  selling_price REAL NOT NULL DEFAULT 0.0,
  requires_inventory INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_top_selling INTEGER DEFAULT 0,
  allow_sell_without_inventory INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Orders
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  store_id INTEGER NOT NULL,
  shift_id INTEGER,
  cash_register_id INTEGER,
  table_id INTEGER,
  customer_id INTEGER,
  user_id INTEGER NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0.0,
  tax_amount REAL NOT NULL DEFAULT 0.0,
  discount_amount REAL NOT NULL DEFAULT 0.0,
  total REAL NOT NULL DEFAULT 0.0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  paid_at TEXT,
  sync_status TEXT DEFAULT 'synced',
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order Items
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_of_measure_id INTEGER,
  unit_price REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0.0,
  tax_amount REAL NOT NULL DEFAULT 0.0,
  total REAL NOT NULL,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (unit_of_measure_id) REFERENCES unit_of_measures(id)
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  material_id INTEGER,
  product_id INTEGER,
  quantity REAL NOT NULL,
  unit_of_measure_id INTEGER,
  unit_cost REAL,
  total_cost REAL,
  notes TEXT,
  FOREIGN KEY (entry_id) REFERENCES inventory_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Indexes for performance
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_sync_status ON orders(sync_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

## Implementation

### SQLite Setup

```typescript
// src/db/sqlite.ts
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });
  
  // Try to load existing database from IndexedDB
  const savedDb = await loadDatabaseFromIndexedDB();
  
  if (savedDb) {
    db = new SQL.Database(savedDb);
  } else {
    db = new SQL.Database();
    await createSchema(db);
  }
  
  return db;
}

async function createSchema(db: Database) {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      ...
    );
  `);
  
  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);`);
  
  // Save to IndexedDB
  await saveDatabaseToIndexedDB(db);
}

async function saveDatabaseToIndexedDB(db: Database) {
  const data = db.export();
  const request = indexedDB.open('pos-database', 1);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const transaction = request.result.transaction(['database'], 'readwrite');
      const store = transaction.objectStore('database');
      store.put(data, 'sqlite-db');
      resolve();
    };
    request.onerror = reject;
  });
}

async function loadDatabaseFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pos-database', 1);
    
    request.onsuccess = () => {
      const transaction = request.result.transaction(['database'], 'readonly');
      const store = transaction.objectStore('database');
      const getRequest = store.get('sqlite-db');
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
      getRequest.onerror = reject;
    };
    request.onerror = reject;
  });
}
```

### Query Functions

```typescript
// src/db/queries/products.ts
import { db } from '../sqlite';

export async function getProducts(filters: {
  storeId: number;
  categoryId?: number;
  search?: string;
  isActive?: boolean;
}) {
  let query = `
    SELECT p.*, pc.name as category_name
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.store_id = ?
  `;
  const params: any[] = [filters.storeId];
  
  if (filters.categoryId) {
    query += ' AND p.category_id = ?';
    params.push(filters.categoryId);
  }
  
  if (filters.search) {
    query += ' AND (p.name LIKE ? OR p.code LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  if (filters.isActive !== undefined) {
    query += ' AND p.is_active = ?';
    params.push(filters.isActive ? 1 : 0);
  }
  
  const stmt = db.prepare(query);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

export async function getOrderWithItems(orderId: number) {
  const query = `
    SELECT 
      o.*,
      oi.id as item_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      oi.total as item_total,
      p.name as product_name,
      p.code as product_code
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = ?
  `;
  
  const stmt = db.prepare(query);
  stmt.bind([orderId]);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  // Group items by order
  if (results.length === 0) return null;
  
  const order = {
    ...results[0],
    items: results
      .filter(r => r.item_id)
      .map(r => ({
        id: r.item_id,
        productId: r.product_id,
        productName: r.product_name,
        productCode: r.product_code,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        total: r.item_total,
      })),
  };
  
  return order;
}
```

### Sync Queue (IndexedDB)

```typescript
// src/sync/syncQueue.ts
const DB_NAME = 'pos-sync-queue';
const STORE_NAME = 'queue';

export async function addToSyncQueue(item: {
  type: string;
  action: string;
  dataId: number;
  data?: any;
}) {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await store.add({
    ...item,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}

export async function getSyncQueue() {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return store.getAll();
}

async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}
```

## Performance Considerations

### Web Workers

Run SQLite operations in Web Workers to avoid blocking the UI:

```typescript
// src/db/worker.ts
import initSqlJs from 'sql.js';

self.onmessage = async (e) => {
  const { type, query, params } = e.data;
  
  if (type === 'init') {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    self.postMessage({ type: 'ready', db });
  } else if (type === 'query') {
    const stmt = db.prepare(query);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    self.postMessage({ type: 'result', results });
  }
};
```

### Caching Strategy

- **Product List**: Cache in memory, refresh on sync
- **Order Totals**: Calculate on-demand, cache in component state
- **Images**: Store in IndexedDB cache, lazy load

## Migration Strategy

1. **Initial Setup**: Create schema on first launch
2. **Schema Updates**: Run migrations similar to backend
3. **Data Sync**: Sync schema changes from backend
4. **Version Control**: Track database version

## Backup and Recovery

- **Auto-save**: Save SQLite database to IndexedDB periodically
- **Export**: Allow exporting database for backup
- **Import**: Allow importing database for recovery
- **Sync**: Re-sync from backend if corruption detected

