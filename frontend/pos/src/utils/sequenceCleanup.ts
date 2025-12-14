/**
 * Daily sequence cleanup utility.
 * Checks if date changed and cleans up old sequences.
 */
import { openDatabase } from '../db'
import { cleanupOldSequences } from '../db/queries/sequences'

const LAST_CLEANUP_DATE_KEY = 'pos_last_sequence_cleanup_date'

/**
 * Check if date changed and cleanup old sequences if needed.
 * Should be called on app startup and when generating new sequences.
 */
export async function checkAndCleanupSequences(): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const lastCleanupDate = localStorage.getItem(LAST_CLEANUP_DATE_KEY)
  
  if (lastCleanupDate !== today) {
    try {
      const db = await openDatabase()
      await cleanupOldSequences(db)
      localStorage.setItem(LAST_CLEANUP_DATE_KEY, today)
      console.log('[sequenceCleanup] Cleaned up old sequences')
    } catch (error) {
      console.error('[sequenceCleanup] Error cleaning up sequences:', error)
      // Don't throw - cleanup failure shouldn't block app startup
    }
  }
}

