/**
 * Sequence query functions for IndexedDB.
 */
import type { IDBPDatabase } from 'idb'
import type { POSDatabase } from '../indexeddb'

export interface Sequence {
  id: string // Composite key: `${cash_register_id}-${doc_type}-${date}`
  cash_register_id: number
  doc_type: 'shift' | 'inventory'
  date: string // YYYY-MM-DD format
  sequence_number: number
  updated_at: string
}

/**
 * Get sequence for a specific cash register, doc type, and date.
 */
export async function getSequence(
  db: IDBPDatabase<POSDatabase>,
  cashRegisterId: number,
  docType: 'shift' | 'inventory',
  date: string // YYYY-MM-DD format
): Promise<Sequence | null> {
  const id = `${cashRegisterId}-${docType}-${date}`
  return (await db.get('sequences', id)) || null
}

/**
 * Increment and return new sequence number.
 */
export async function incrementSequence(
  db: IDBPDatabase<POSDatabase>,
  cashRegisterId: number,
  docType: 'shift' | 'inventory',
  date: string // YYYY-MM-DD format
): Promise<number> {
  const id = `${cashRegisterId}-${docType}-${date}`
  const existing = await db.get('sequences', id)
  
  const newSequence = existing ? existing.sequence_number + 1 : 1
  
  const sequence: Sequence = {
    id,
    cash_register_id: cashRegisterId,
    doc_type: docType,
    date,
    sequence_number: newSequence,
    updated_at: new Date().toISOString(),
  }
  
  await db.put('sequences', sequence)
  return newSequence
}

/**
 * Initialize sequences from sync data.
 */
export async function initializeSequences(
  db: IDBPDatabase<POSDatabase>,
  sequences: Array<{
    cash_register_id: number
    doc_type: 'shift' | 'inventory'
    date: string
    sequence_number: number
  }>
): Promise<void> {
  const tx = db.transaction('sequences', 'readwrite')
  await Promise.all(
    sequences.map(seq => {
      const id = `${seq.cash_register_id}-${seq.doc_type}-${seq.date}`
      return tx.store.put({
        id,
        cash_register_id: seq.cash_register_id,
        doc_type: seq.doc_type,
        date: seq.date,
        sequence_number: seq.sequence_number,
        updated_at: new Date().toISOString(),
      })
    })
  )
  await tx.done
}

/**
 * Cleanup sequences for dates before today.
 */
export async function cleanupOldSequences(
  db: IDBPDatabase<POSDatabase>
): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const allSequences = await db.getAll('sequences')
  
  const tx = db.transaction('sequences', 'readwrite')
  await Promise.all(
    allSequences
      .filter(seq => seq.date < today)
      .map(seq => tx.store.delete(seq.id))
  )
  await tx.done
}

