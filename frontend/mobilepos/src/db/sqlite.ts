import * as SQLite from 'expo-sqlite'

const DB_NAME = 'sofiapos.db'
const DB_VERSION = 1

let dbInstance: SQLite.SQLiteDatabase | null = null

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance

  const db = await SQLite.openDatabaseAsync(DB_NAME)
  await db.execAsync('PRAGMA journal_mode = WAL;')
  await db.execAsync('PRAGMA foreign_keys = ON;')

  await runMigrations(db)
  dbInstance = db
  return db
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY);`)

  const row = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) as version FROM _migrations')
  const currentVersion = row?.version ?? 0

  if (currentVersion < 1) {
    await migrateV1(db)
    await db.runAsync('INSERT INTO _migrations (version) VALUES (?)', 1)
  }
}

async function migrateV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      selling_price REAL NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'product',
      category_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      tax_rate REAL NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_categories_sync ON categories(sync_status);

    CREATE TABLE IF NOT EXISTS orders (
      order_number TEXT PRIMARY KEY,
      id INTEGER NOT NULL DEFAULT 0,
      store_id INTEGER NOT NULL,
      shift_id INTEGER,
      cash_register_id INTEGER,
      customer_id INTEGER,
      table_id INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      taxes REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      amount_paid REAL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_sync ON orders(sync_status);
    CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
    CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      order_id INTEGER,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_of_measure_id INTEGER,
      unit_price REAL NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_sync ON order_items(sync_status);

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      unit_of_measure_id INTEGER,
      unit_cost REAL,
      vendor_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS unit_of_measures (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_unit_of_measures (
      id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      unit_of_measure_id INTEGER NOT NULL,
      conversion_factor REAL NOT NULL DEFAULT 1,
      is_base_unit INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_puom_product ON product_unit_of_measures(product_id);

    CREATE TABLE IF NOT EXISTS material_unit_of_measures (
      id INTEGER PRIMARY KEY,
      material_id INTEGER NOT NULL,
      unit_of_measure_id INTEGER NOT NULL,
      conversion_factor REAL NOT NULL DEFAULT 1,
      is_base_unit INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_muom_material ON material_unit_of_measures(material_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      store_id INTEGER,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      shift_number TEXT PRIMARY KEY,
      id INTEGER NOT NULL DEFAULT 0,
      store_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opened_by_user_id INTEGER,
      closed_by_user_id INTEGER,
      initial_cash REAL,
      inventory_balance REAL,
      notes TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
    CREATE INDEX IF NOT EXISTS idx_shifts_sync ON shifts(sync_status);
    CREATE INDEX IF NOT EXISTS idx_shifts_store ON shifts(store_id);

    CREATE TABLE IF NOT EXISTS tables_store (
      id INTEGER PRIMARY KEY,
      store_id INTEGER NOT NULL,
      table_number TEXT NOT NULL,
      name TEXT,
      capacity INTEGER NOT NULL DEFAULT 4,
      location TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tables_store ON tables_store(store_id);

    CREATE TABLE IF NOT EXISTS inventory_entries (
      entry_number TEXT PRIMARY KEY,
      id INTEGER NOT NULL DEFAULT 0,
      store_id INTEGER NOT NULL,
      vendor_id INTEGER,
      entry_type TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      notes TEXT,
      created_by_user_id INTEGER,
      shift_id INTEGER,
      shift_number TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inv_entries_sync ON inventory_entries(sync_status);
    CREATE INDEX IF NOT EXISTS idx_inv_entries_store ON inventory_entries(store_id);
    CREATE INDEX IF NOT EXISTS idx_inv_entries_shift ON inventory_entries(shift_number);

    CREATE TABLE IF NOT EXISTS inventory_entry_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_number TEXT NOT NULL,
      entry_id INTEGER NOT NULL DEFAULT 0,
      material_id INTEGER,
      product_id INTEGER,
      quantity REAL NOT NULL,
      unit_of_measure_id INTEGER,
      unit_cost REAL,
      total_cost REAL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (entry_number) REFERENCES inventory_entries(entry_number) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_inv_details_entry ON inventory_entry_details(entry_number);

    CREATE TABLE IF NOT EXISTS inventory_control_config (
      id INTEGER PRIMARY KEY,
      item_type TEXT NOT NULL,
      product_id INTEGER,
      material_id INTEGER,
      show_in_inventory INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 0,
      uofm1_id INTEGER,
      uofm2_id INTEGER,
      uofm3_id INTEGER,
      product_name TEXT,
      material_name TEXT,
      uofm1_abbreviation TEXT,
      uofm2_abbreviation TEXT,
      uofm3_abbreviation TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_prefixes (
      id INTEGER PRIMARY KEY,
      store_id INTEGER,
      doc_type TEXT NOT NULL,
      prefix TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_doc_prefix_store ON document_prefixes(store_id);

    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      cash_register_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      date TEXT NOT NULL,
      sequence_number INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      yield_quantity REAL NOT NULL DEFAULT 1,
      yield_unit_of_measure_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id);

    CREATE TABLE IF NOT EXISTS recipe_materials (
      id INTEGER PRIMARY KEY,
      recipe_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_of_measure_id INTEGER,
      display_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recipe_mat_recipe ON recipe_materials(recipe_id);

    CREATE TABLE IF NOT EXISTS shift_summaries (
      shift_number TEXT PRIMARY KEY,
      shift_id INTEGER,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      initial_cash REAL NOT NULL DEFAULT 0,
      final_cash REAL,
      expected_cash REAL NOT NULL DEFAULT 0,
      difference REAL,
      bank_transfer_balance REAL NOT NULL DEFAULT 0,
      inventory_summary TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      data_id TEXT NOT NULL,
      data TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type);

    CREATE TABLE IF NOT EXISTS sync_state (
      entity_type TEXT PRIMARY KEY,
      last_sync_at TEXT NOT NULL,
      store_id INTEGER,
      updated_at TEXT NOT NULL
    );
  `)
}

export async function clearAllData(db: SQLite.SQLiteDatabase): Promise<void> {
  const tables = [
    'products', 'categories', 'orders', 'order_items', 'customers',
    'materials', 'unit_of_measures', 'product_unit_of_measures',
    'material_unit_of_measures', 'settings', 'shifts', 'tables_store',
    'inventory_entries', 'inventory_entry_details', 'inventory_control_config',
    'document_prefixes', 'sequences', 'recipes', 'recipe_materials',
    'shift_summaries', 'sync_queue', 'sync_state',
  ]
  for (const table of tables) {
    await db.runAsync(`DELETE FROM ${table}`)
  }
}
