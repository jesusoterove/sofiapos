/**
 * Sync manager for offline-first functionality.
 */
import { openDatabase, getSyncQueue, removeFromSyncQueue, saveOrder, saveOrderItem } from '../db'
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
          await axios.post(`${API_BASE_URL}/api/v1/orders`, item.data)
        } else if (item.action === 'update') {
          await axios.put(`${API_BASE_URL}/api/v1/orders/${item.data_id}`, item.data)
        }
        break
      case 'order_item':
        if (item.action === 'create') {
          await axios.post(`${API_BASE_URL}/api/v1/order-items`, item.data)
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

