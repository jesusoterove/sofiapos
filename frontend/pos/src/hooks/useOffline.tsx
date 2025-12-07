/**
 * Hook for offline status and sync queue management.
 */
import { useState, useEffect } from 'react'
import { openDatabase, getSyncQueueCount } from '../db'
import { syncManager } from '../api/sync'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    const updatePendingCount = async () => {
      const db = await openDatabase()
      const count = await getSyncQueueCount(db)
      setPendingCount(count)
    }

    // Update pending count every 5 seconds
    const interval = setInterval(updatePendingCount, 5000)
    updatePendingCount()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  const syncNow = async () => {
    setIsSyncing(true)
    try {
      await syncManager.sync()
      const db = await openDatabase()
      const count = await getSyncQueueCount(db)
      setPendingCount(count)
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
  }
}

