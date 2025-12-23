/**
 * Sync manager for offline-first functionality.
 */
import { openDatabase, getSyncQueue, removeFromSyncQueue, saveOrder } from '../db'
import apiClient from './client'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime?: Date
}

class SyncManager {
  private isOnline = navigator.onLine
  private isSyncing = false
  private syncInterval?: NodeJS.Timeout

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.sync()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Start periodic sync (every 30 seconds when online)
    this.startPeriodicSync()
  }

  async sync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return
    }

    this.isSyncing = true
    const db = await openDatabase()
    const queue = await getSyncQueue(db)

    for (const item of queue) {
      try {
        await this.syncItem(item)
        await removeFromSyncQueue(db, item.id)
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
        // Increment retry count and keep in queue
        // For now, we'll just log the error
      }
    }

    this.isSyncing = false
  }

  private async syncItem(item: any): Promise<void> {
    switch (item.type) {
      case 'order':
        if (item.action === 'create') {
          // Only sync paid orders (not draft orders)
          if (item.data?.status === 'paid') {
            const response = await apiClient.post('/api/v1/orders', item.data)
            // Update order sync status and ID after successful sync
            // data_id is order_number (primary key for local operations)
            const db = await openDatabase()
            const order = await db.get('orders', item.data_id as string)
            if (order) {
              // Update with server ID (order_number remains the primary key)
              const updatedOrder = {
                ...order,
                order_number: order.order_number, // PRIMARY KEY - keep local order_number
                id: response.data.id || order.id, // Use server ID if provided (for reference only)
                sync_status: 'synced' as const,
              }
              // Save using order_number as key (put will update existing record)
              await saveOrder(db, updatedOrder)
            }
          }
        } else if (item.action === 'update') {
          // Only sync paid orders
          // Note: Orders are never updated locally, only created and paid
          // This case should not occur, but kept for safety
          if (item.data?.status === 'paid') {
            await apiClient.put(`/api/v1/orders/${item.data_id}`, item.data)
            // Update order sync status after successful sync
            // data_id is order_number (primary key for local operations)
            const db = await openDatabase()
            const order = await db.get('orders', item.data_id as string)
            if (order) {
              await saveOrder(db, { ...order, sync_status: 'synced' })
            }
          }
        }
        break
      case 'order_item':
        if (item.action === 'create') {
          await apiClient.post('/api/v1/order-items', item.data)
        }
        break
      case 'inventory_entry':
        if (item.action === 'create') {
          const response = await apiClient.post('/api/v1/inventory-entries', item.data)
          // Update inventory entry sync status after successful sync
          // data_id is entry_number (primary key for local operations)
          const db = await openDatabase()
          const entry = await db.get('inventory_entries', item.data_id as string)
          if (entry) {
            // Extract remote ID from response - FastAPI returns the model directly in response.data
            const serverId = response.data?.id
            if (serverId === undefined || serverId === null || typeof serverId !== 'number') {
              console.error('[sync] Inventory entry sync response missing or invalid id:', response.data)
              throw new Error(`Failed to get remote ID for inventory entry ${entry.entry_number}`)
            }
            
            // Update with server ID (entry_number remains the primary key)
            const updatedEntry = {
              ...entry,
              entry_number: entry.entry_number, // PRIMARY KEY - keep local entry_number
              id: serverId, // Always use server ID from response
              sync_status: 'synced' as const,
              updated_at: new Date().toISOString(),
            }
            // Save using entry_number as key (put will update existing record)
            await db.put('inventory_entries', updatedEntry)
            console.log(`[sync] Updated inventory entry ${entry.entry_number} with remote id: ${serverId}`)
          } else {
            console.error(`[sync] Inventory entry with entry_number '${item.data_id}' not found in local database`)
          }
        } else if (item.action === 'update') {
          // Note: Inventory entries are typically never updated locally, only created
          // This case should not occur, but kept for safety
          // data_id is entry_number, but we need entry.id for the API call
          const db = await openDatabase()
          const entry = await db.get('inventory_entries', item.data_id as string)
          if (!entry || !entry.id || entry.id === 0) {
            throw new Error(`Inventory entry with entry_number '${item.data_id}' not found or not synced`)
          }
          await apiClient.put(`/api/v1/inventory-entries/${entry.id}`, item.data)
          // Update inventory entry sync status after successful sync
          await db.put('inventory_entries', { ...entry, sync_status: 'synced' })
        }
        break
      case 'inventory_entry_detail':
        if (item.action === 'create') {
          const response = await apiClient.post('/api/v1/inventory-transactions', item.data)
          // Update inventory entry detail sync status after successful sync
          const db = await openDatabase()
          const detail = await db.get('inventory_entry_details', item.data_id)
          if (detail) {
            // Update with server ID
            const updatedDetail = {
              ...detail,
              id: response.data.id || detail.id, // Use server ID if provided
              sync_status: 'synced' as const,
            }
            await db.put('inventory_entry_details', updatedDetail)
          }
        }
        break
      case 'shift':
        if (item.action === 'create') {
          // Get cash_register_id from registration (required for shift creation)
          const { getRegistration } = await import('../utils/registration')
          const registration = getRegistration()
          
          if (!registration?.cashRegisterId) {
            throw new Error('Cash register not registered. Cannot sync shift without cash register ID.')
          }
          
          const response = await apiClient.post('/api/v1/shifts/open', {
            cash_register_id: registration.cashRegisterId, // Use cash_register_id instead of store_id
            initial_cash: item.data.initial_cash,
            inventory_balance: item.data.inventory_balance,
            shift_number: item.data.shift_number, // Send locally generated shift_number
          })
          // Update shift sync status and ID after successful sync
          const db = await openDatabase()
          // Find shift by shift_number (primary key)
          const shift = await db.get('shifts', item.data.shift_number as any)
          
          if (shift) {
            // Update with server ID (shift_number remains the primary key)
            const updatedShift = {
              ...shift,
              shift_number: shift.shift_number, // PRIMARY KEY - keep local shift_number
              id: response.data.id, // Server-generated ID (for remote sync)
              sync_status: 'synced' as const,
              updated_at: new Date().toISOString(),
            }
            // Update IndexedDB (source of truth) - no localStorage needed
            await db.put('shifts', updatedShift)
          }
        } else if (item.action === 'close') {
          // REMOTE SYNC: Find shift by shift_number (local operation), then use id for remote API call
          const db = await openDatabase()
          
          // data_id is shift_number (primary key)
          const shiftNumber = item.data_id as string
          if (!shiftNumber) {
            throw new Error(`Shift number not found in sync data: ${item.data_id}`)
          }
          
          // Find by shift_number (primary key)
          const shift = await db.get('shifts', shiftNumber as any)
          
          if (!shift) {
            throw new Error(`Shift with number '${shiftNumber}' not found for sync`)
          }
          
          // REMOTE SYNC: Use id when calling remote API
          // If id is 0, use create endpoint; if id != 0, use update endpoint
          const closeData = item.data.close_data
          
          if (shift.id === 0 || shift.id === '0') {
            // Shift hasn't been synced yet - create and close in one operation
            // First create the shift, then close it
            // Get cash_register_id from registration
            const { getRegistration } = await import('../utils/registration')
            const registration = getRegistration()
            
            if (!registration?.cashRegisterId) {
              throw new Error('Cash register not registered. Cannot sync shift without cash register ID.')
            }
            
            const createResponse = await apiClient.post('/api/v1/shifts/open', {
              cash_register_id: registration.cashRegisterId,
              initial_cash: shift.initial_cash,
              inventory_balance: shift.inventory_balance,
              shift_number: shift.shift_number,
            })

            shift.id = createResponse.data.id
            shift.updated_at = new Date().toISOString()
            await db.put('shifts', shift)
          }
          // Now close it
          await apiClient.post(`/api/v1/shifts/${shift.id}/close-with-inventory`, {
            ...closeData,
            shift_number: shift.shift_number,
          })
          
          // Update local shift with server ID
          const updatedShift = {
            ...shift,
            shift_number: shift.shift_number, // PRIMARY KEY
            id: shift.id, // Server-generated ID
            status: 'closed' as const,
            sync_status: 'synced' as const,
            updated_at: new Date().toISOString(),
          }
          await db.put('shifts', updatedShift)
          //For Agent: No need to remove local storage. Sync is a background job and should not affect local storage, since local storage should have been updated during the local operation before enqueuing the sync item.
        } else if (item.action === 'update') {
          // REMOTE SYNC: Update shift on server
          const db = await openDatabase()
          const shift = await db.get('shifts', item.data_id as string as any) // data_id is shift_number
          
          if (!shift) {
            throw new Error(`Shift with number '${item.data_id}' not found for update`)
          }
          
          // Use id for remote API call
          if (shift.id === 0 || shift.id === '0') {
            // Shift not synced yet - create it first
            // Get cash_register_id from registration
            const { getRegistration } = await import('../utils/registration')
            const registration = getRegistration()
            
            if (!registration?.cashRegisterId) {
              throw new Error('Cash register not registered. Cannot sync shift without cash register ID.')
            }
            
            const response = await apiClient.post('/api/v1/shifts/open', {
              cash_register_id: registration.cashRegisterId,
              initial_cash: shift.initial_cash,
              inventory_balance: shift.inventory_balance,
              shift_number: shift.shift_number,
            })
            
            // Update local shift with server ID
            const updatedShift = {
              ...shift,
              shift_number: shift.shift_number, // PRIMARY KEY
              id: response.data.id, // Server-generated ID
              sync_status: 'synced' as const,
              updated_at: new Date().toISOString(),
            }
            await db.put('shifts', updatedShift)
          } else {
            // Update existing shift
            await apiClient.put(`/api/v1/shifts/${shift.id}`, item.data)
            
            // Update sync status
            const updatedShift = {
              ...shift,
              shift_number: shift.shift_number, // PRIMARY KEY
              sync_status: 'synced' as const,
              updated_at: new Date().toISOString(),
            }
            await db.put('shifts', updatedShift)
          }
        }
        break
      case 'table':
        if (item.action === 'create') {
          const response = await apiClient.post('/api/v1/tables', {
            store_id: item.data.store_id,
            table_number: item.data.table_number,
            name: item.data.name,
            capacity: item.data.capacity,
            location: item.data.location,
            is_active: item.data.is_active,
          })
          // Update table sync status after successful sync
          const db = await openDatabase()
          const table = await db.get('tables', item.data_id)
          if (table) {
            // Update with server ID if different
            const updatedTable = {
              ...table,
              id: response.data.id,
              sync_status: 'synced' as const,
              updated_at: response.data.updated_at || null,
            }
            await db.put('tables', updatedTable)
          }
        } else if (item.action === 'update') {
          await apiClient.put(`/api/v1/tables/${item.data_id}`, {
            table_number: item.data.table_number,
            name: item.data.name,
            capacity: item.data.capacity,
            location: item.data.location,
            is_active: item.data.is_active,
          })
          // Update table sync status after successful sync
          const db = await openDatabase()
          const table = await db.get('tables', item.data_id)
          if (table) {
            await db.put('tables', { ...table, sync_status: 'synced' })
          }
        }
        break
      // Add other types as needed
    }
  }

  startPeriodicSync(intervalMs = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync()
      }
    }, intervalMs)
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = undefined
    }
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0, // Will be updated by hook
    }
  }
}

export const syncManager = new SyncManager()

