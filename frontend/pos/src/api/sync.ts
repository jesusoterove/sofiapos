/**
 * Sync manager for offline-first functionality.
 */
import { openDatabase, getSyncQueue, removeFromSyncQueue, saveOrder } from '../db'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
            await axios.post(`${API_BASE_URL}/api/v1/orders`, item.data)
            // Update order sync status after successful sync
            const db = await openDatabase()
            const order = await db.get('orders', item.data_id)
            if (order) {
              await saveOrder(db, { ...order, sync_status: 'synced' })
            }
          }
        } else if (item.action === 'update') {
          // Only sync paid orders
          if (item.data?.status === 'paid') {
            await axios.put(`${API_BASE_URL}/api/v1/orders/${item.data_id}`, item.data)
            // Update order sync status after successful sync
            const db = await openDatabase()
            const order = await db.get('orders', item.data_id)
            if (order) {
              await saveOrder(db, { ...order, sync_status: 'synced' })
            }
          }
        }
        break
      case 'order_item':
        if (item.action === 'create') {
          await axios.post(`${API_BASE_URL}/api/v1/order-items`, item.data)
        }
        break
      case 'inventory_entry':
        if (item.action === 'create') {
          await axios.post(`${API_BASE_URL}/api/v1/inventory-entries`, item.data)
          // Update inventory entry sync status after successful sync
          const db = await openDatabase()
          const entry = await db.get('inventory_entries', item.data_id)
          if (entry) {
            await db.put('inventory_entries', { ...entry, sync_status: 'synced' })
          }
        } else if (item.action === 'update') {
          await axios.put(`${API_BASE_URL}/api/v1/inventory-entries/${item.data_id}`, item.data)
          // Update inventory entry sync status after successful sync
          const db = await openDatabase()
          const entry = await db.get('inventory_entries', item.data_id)
          if (entry) {
            await db.put('inventory_entries', { ...entry, sync_status: 'synced' })
          }
        }
        break
      case 'inventory_transaction':
        if (item.action === 'create') {
          await axios.post(`${API_BASE_URL}/api/v1/inventory-transactions`, item.data)
          // Update inventory transaction sync status after successful sync
          const db = await openDatabase()
          const transaction = await db.get('inventory_transactions', item.data_id)
          if (transaction) {
            await db.put('inventory_transactions', { ...transaction, sync_status: 'synced' })
          }
        }
        break
      case 'shift':
        if (item.action === 'create') {
          const response = await axios.post(`${API_BASE_URL}/api/v1/shifts/open`, {
            store_id: item.data.store_id,
            initial_cash: item.data.initial_cash,
            inventory_balance: item.data.inventory_balance,
          })
          // Update shift sync status after successful sync
          const db = await openDatabase()
          const shift = await db.get('shifts', item.data_id)
          if (shift) {
            // Update with server ID if different
            const updatedShift = {
              ...shift,
              id: response.data.id,
              shift_number: response.data.shift_number,
              sync_status: 'synced' as const,
            }
            await db.put('shifts', updatedShift)
            // Also update localStorage
            localStorage.setItem('pos_current_shift', JSON.stringify(updatedShift))
          }
        } else if (item.action === 'update') {
          await axios.put(`${API_BASE_URL}/api/v1/shifts/${item.data_id}`, item.data)
          // Update shift sync status after successful sync
          const db = await openDatabase()
          const shift = await db.get('shifts', item.data_id)
          if (shift) {
            await db.put('shifts', { ...shift, sync_status: 'synced' })
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

