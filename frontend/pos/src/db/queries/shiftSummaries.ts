/**
 * Shift summaries queries for IndexedDB.
 */
import { IDBPDatabase } from 'idb'
import { POSDatabase } from '../indexeddb'

export async function getShiftSummary(db: IDBPDatabase<POSDatabase>, shiftNumber: string): Promise<POSDatabase['shift_summaries']['value'] | undefined> {
  return db.get('shift_summaries', shiftNumber)
}

export async function saveShiftSummary(db: IDBPDatabase<POSDatabase>, summary: POSDatabase['shift_summaries']['value']) {
  try {
    // Verify the store exists
    if (!db.objectStoreNames.contains('shift_summaries')) {
      throw new Error('shift_summaries store does not exist in database. Please refresh the page to upgrade the database.')
    }
    
    console.log('[saveShiftSummary] Saving summary for shift:', summary.shift_number)
    const result = await db.put('shift_summaries', summary)
    console.log('[saveShiftSummary] Summary saved successfully')
    return result
  } catch (error) {
    console.error('[saveShiftSummary] Error saving shift summary:', error)
    throw error
  }
}

export async function deleteShiftSummary(db: IDBPDatabase<POSDatabase>, shiftNumber: string) {
  return db.delete('shift_summaries', shiftNumber)
}

