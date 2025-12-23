/**
 * Document number generation utilities.
 * Generates document numbers using base-36 encoding with cash register codes and prefixes.
 */
import { encodeBase36 } from './base36'
import { openDatabase } from '../db'
import { getDocumentPrefixByType } from '../db/queries/documentPrefixes'
import { incrementSequence } from '../db/queries/sequences'
import { checkAndCleanupSequences } from './sequenceCleanup'

function getDateAsNumber(precision: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'): number {
  const now = new Date()
  let timestamp = now.getFullYear()

  if (precision === 'year') {
    return timestamp
  }

  const getters = [
    { key:'month', get: () => now.getMonth() + 1},
    { key:'day', get: () => now.getDate()},
    { key:'hour', get: () => now.getHours()},
    { key:'minute', get: () => now.getMinutes()},
    { key:'second', get: () => now.getSeconds()},
  ]

  for (const getter of getters) {
    timestamp = timestamp * 100 + getter.get()
    if (getter.key === precision) {
      break;
    }
  }
  return timestamp
}

/**
 * Generate order number.
 * Format: [invoice_prefix][cash_register_code]-[base36(yyyyMMddHHmmss)]
 * 
 * @param cashRegisterCode - Cash register code (e.g., "SAA-AAA")
 * @param storeId - Store ID (optional, for prefix lookup)
 * @returns Order number
 */
export async function generateOrderNumber(
  cashRegisterCode: string,
  storeId?: number
): Promise<string> {
  // Get invoice prefix (default: 'F')
  const db = await openDatabase()
  const prefix = await getDocumentPrefixByType(db, 'invoice', storeId)
  const invoicePrefix = prefix?.prefix || 'F'
  
  // Generate timestamp in base-36: yyyyMMddHHmmss
  const timestamp = getDateAsNumber('second')
  const timestampBase36 = encodeBase36(timestamp)
  
  return `${invoicePrefix}${cashRegisterCode}-${timestampBase36}`
}

/**
 * Generate payment number.
 * Format: [payment_prefix][cash_register_code]-[base36(yyyyMMddHHmmss)]
 * 
 * @param cashRegisterCode - Cash register code (e.g., "SAA-AAA")
 * @param storeId - Store ID (optional, for prefix lookup)
 * @returns Payment reference number
 */
export async function generatePaymentNumber(
  cashRegisterCode: string,
  storeId?: number
): Promise<string> {
  // Get payment prefix (default: 'P')
  const db = await openDatabase()
  const prefix = await getDocumentPrefixByType(db, 'payment', storeId)
  const paymentPrefix = prefix?.prefix || 'P'
  
  // Generate timestamp in base-36: yyyyMMddHHmmss
  const timestamp = getDateAsNumber('second')
  const timestampBase36 = encodeBase36(timestamp)
  
  return `${paymentPrefix}${cashRegisterCode}-${timestampBase36}`
}

/**
 * Generate shift number.
 * Format: [shift_prefix][cash_register_code]-[base36(MMddyyyyxx)] where xx is 2-digit sequence
 * 
 * @param cashRegisterId - Cash register ID
 * @param cashRegisterCode - Cash register code (e.g., "SAA-AAA")
 * @param storeId - Store ID (optional, for prefix lookup)
 * @returns Shift number
 */
export async function generateShiftNumber(
  cashRegisterId: number,
  cashRegisterCode: string,
  storeId?: number
): Promise<string> {
  // Check and cleanup old sequences
  await checkAndCleanupSequences()
  
  // Get shift prefix (default: 'T')
  const db = await openDatabase()
  const prefix = await getDocumentPrefixByType(db, 'shift', storeId)
  const shiftPrefix = prefix?.prefix || 'T'
  
  // Get current date in MMddyyyy format
  const timestamp = getDateAsNumber('day')
  const dateKey = timestamp.toString() // YYYY-MM-DD for sequence lookup
  
  // Get or increment sequence for this cash register, doc type, and date
  const sequence = await incrementSequence(db, cashRegisterId, 'shift', dateKey)
  // Encode date + sequence: MMddyyyyxx (xx is 2-digit sequence, base-36 padded)
  const sequencePadded = encodeBase36(sequence, 2) // 2-digit base-36 sequence
  const dateBase36 = encodeBase36(timestamp)

  return `${shiftPrefix}${cashRegisterCode}-${dateBase36}${sequencePadded}`
}

/**
 * Generate inventory transaction number.
 * Format: [inventory_prefix][cash_register_code]-[base36(MMddyyyyxx)] where xx is 2-digit sequence
 * 
 * @param cashRegisterId - Cash register ID
 * @param cashRegisterCode - Cash register code (e.g., "SAA-AAA")
 * @param storeId - Store ID (optional, for prefix lookup)
 * @returns Inventory transaction number
 */
export async function generateInventoryNumber(
  cashRegisterId: number,
  cashRegisterCode: string,
  storeId?: number
): Promise<string> {
  // Check and cleanup old sequences
  await checkAndCleanupSequences()
  
  // Get inventory prefix (default: 'I')
  const db = await openDatabase()
  const prefix = await getDocumentPrefixByType(db, 'inventory', storeId)
  const inventoryPrefix = prefix?.prefix || 'I'
  
  // Get current date in MMddyyyy format
  const timestamp = getDateAsNumber('day')
  const dateKey = timestamp.toString() // YYYY-MM-DD for sequence lookup
  
  // Get or increment sequence for this cash register, doc type, and date
  const sequence = await incrementSequence(db, cashRegisterId, 'inventory', dateKey)
  
  // Encode date + sequence: MMddyyyyxx (xx is 2-digit sequence, base-36 padded)
  const sequencePadded = encodeBase36(sequence, 2) // 2-digit base-36 sequence
  const dateBase36 = encodeBase36(timestamp)
  
  return `${inventoryPrefix}${cashRegisterCode}-${dateBase36}${sequencePadded}`
}

