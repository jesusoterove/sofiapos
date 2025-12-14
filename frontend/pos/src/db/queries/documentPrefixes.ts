/**
 * Document prefix query functions for IndexedDB.
 */
import type { IDBPDatabase } from 'idb'
import type { POSDatabase } from '../indexeddb'

export interface DocumentPrefix {
  id: number
  store_id?: number | null
  doc_type: 'shift' | 'invoice' | 'inventory' | 'payment'
  prefix: string
  is_active: boolean
  sync_status: 'synced' | 'pending' | 'error'
  updated_at: string
}

/**
 * Save document prefixes to IndexedDB.
 */
export async function saveDocumentPrefixes(
  db: IDBPDatabase<POSDatabase>,
  prefixes: DocumentPrefix[]
): Promise<void> {
  const tx = db.transaction('document_prefixes', 'readwrite')
  await Promise.all(prefixes.map(prefix => tx.store.put(prefix)))
  await tx.done
}

/**
 * Get all document prefixes.
 */
export async function getAllDocumentPrefixes(
  db: IDBPDatabase<POSDatabase>,
  storeId?: number
): Promise<DocumentPrefix[]> {
  if (storeId !== undefined) {
    // Get store-specific prefixes, fallback to global (store_id is null)
    const storePrefixes = await db.getAllFromIndex('document_prefixes', 'by-store', storeId)
    const globalPrefixes = await db.getAllFromIndex('document_prefixes', 'by-store', null)
    // Combine and deduplicate by doc_type (store-specific takes precedence)
    const prefixMap = new Map<string, DocumentPrefix>()
    globalPrefixes.forEach(p => {
      if (!prefixMap.has(p.doc_type)) {
        prefixMap.set(p.doc_type, p)
      }
    })
    storePrefixes.forEach(p => {
      prefixMap.set(p.doc_type, p) // Store-specific overrides global
    })
    return Array.from(prefixMap.values())
  }
  return db.getAll('document_prefixes')
}

/**
 * Get document prefix by doc_type.
 */
export async function getDocumentPrefixByType(
  db: IDBPDatabase<POSDatabase>,
  docType: 'shift' | 'invoice' | 'inventory' | 'payment',
  storeId?: number
): Promise<DocumentPrefix | null> {
  const prefixes = await getAllDocumentPrefixes(db, storeId)
  return prefixes.find(p => p.doc_type === docType && p.is_active) || null
}

