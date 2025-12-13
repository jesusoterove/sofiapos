/**
 * Hook for shift management - optimized for context usage.
 * This is the internal hook used by ShiftContext.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/api/client'
import { openDatabase, saveShift, getOpenShift, addToSyncQueue, removeFromSyncQueue, getSyncQueue } from '@/db'
import type { POSDatabase } from '@/db'
import { getAllInventoryControlConfig } from '@/db/queries/inventoryControlConfig'
import type { InventoryControlConfig } from '@/api/inventoryControl'
import { closeShiftWithInventory, getShiftInventory, type ShiftInventoryEntryResponse } from '@/api/shifts'
import type { ShiftCloseWithInventoryRequest } from '@/api/inventoryControl'

export interface Shift {
  id: number | string
  shift_number: string
  status: 'open' | 'closed'
  store_id: number
  opened_at: string
  closed_at?: string
  initial_cash?: number
  inventory_balance?: number
}

export interface OpenShiftData {
  initialCash: number
  inventoryBalance?: number
}

export function useShiftManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Check for open shift - offline-first: check local first, then API
  const { data: currentOpenShift, isLoading: isLoadingShift } = useQuery({
    queryKey: ['shift', 'open', user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return null

      // ALWAYS check local storage first (offline-first)
      const localShift = localStorage.getItem('pos_current_shift')
      if (localShift) {
        try {
          const parsed = JSON.parse(localShift)
          // Verify it's for the current store and is open
          if (parsed.store_id === user.store_id && parsed.status === 'open') {
            return parsed
          }
        } catch (e) {
          console.error('Failed to parse local shift:', e)
        }
      }

      // Also check IndexedDB
      const db = await openDatabase()
      const dbShift = await getOpenShift(db, user.store_id)
      if (dbShift) {
        // Update localStorage for quick access
        localStorage.setItem('pos_current_shift', JSON.stringify(dbShift))
        return dbShift
      }

      // If no local shift, try API (only if online)
      if (navigator.onLine) {
        try {
          const response = await apiClient.get(`/api/v1/shifts/open?store_id=${user.store_id}`)
          if (response.data) {
            // Store locally for offline access
            localStorage.setItem('pos_current_shift', JSON.stringify(response.data))
            // Also save to IndexedDB
            await saveShift(db, {
              ...response.data,
              sync_status: 'synced',
            } as any)
            return response.data
          }
        } catch (error: any) {
          // If API fails, return null (no shift found)
          console.warn('Failed to fetch shift from API:', error)
        }
      }

      return null
    },
    enabled: !!user?.store_id,
    staleTime: 30 * 1000, // 30 seconds
    // Preserve previous data during refetch to prevent hasOpenShift from becoming false temporarily
    placeholderData: (previousData) => previousData,
    // Don't refetch on mount to prevent unnecessary refetches when navigating to CloseShiftPage
    refetchOnMount: false,
    // Only refetch on window focus if data is stale
    refetchOnWindowFocus: false,
  })

  // Open shift mutation - ALWAYS local-first
  const openShiftMutation = useMutation({
    mutationFn: async (data: OpenShiftData) => {
      if (!user?.store_id) {
        throw new Error('User must be assigned to a store')
      }

      // ALWAYS save locally first (offline-first paradigm)
      const db = await openDatabase()
      
      // Ensure shifts store exists (should be created by upgrade, but check to be safe)
      if (!db.objectStoreNames.contains('shifts')) {
        // Store doesn't exist - this shouldn't happen if upgrade ran correctly
        // Fall back to localStorage only and show error
        console.error('Shifts store not found in database. Database may need to be upgraded.')
        const shiftId = `shift-${Date.now()}`
        const shiftNumber = `SHIFT-${Date.now()}`
        const shiftData = {
          id: shiftId,
          shift_number: shiftNumber,
          store_id: user.store_id,
          status: 'open' as const,
          opened_at: new Date().toISOString(),
          initial_cash: data.initialCash,
          inventory_balance: data.inventoryBalance,
          opened_by_user_id: user.id,
        }
        // Store in localStorage only as fallback
        localStorage.setItem('pos_current_shift', JSON.stringify(shiftData))
        return shiftData
      }

      const shiftId = `shift-${Date.now()}`
      const shiftNumber = `SHIFT-${Date.now()}`
      
      const shiftData = {
        id: shiftId,
        shift_number: shiftNumber,
        store_id: user.store_id,
        status: 'open' as const,
        opened_at: new Date().toISOString(),
        initial_cash: data.initialCash,
        inventory_balance: data.inventoryBalance,
        opened_by_user_id: user.id,
      }

      // Save to IndexedDB (this also queues for sync)
      await saveShift(db, shiftData)

      // Also store in localStorage for quick access
      localStorage.setItem('pos_current_shift', JSON.stringify(shiftData))

      // Try to sync in background if online (don't wait for it)
      // The sync manager will handle this automatically, but we can also try immediately
      if (navigator.onLine) {
        // Fire and forget - sync will happen in background via sync manager
        // But we can also try immediately for better UX
        apiClient.post('/api/v1/shifts/open', {
          store_id: user.store_id,
          initial_cash: data.initialCash,
          inventory_balance: data.inventoryBalance,
        }).then(async (response) => {
          // Update local shift with server ID if different
          if (response.data && response.data.id !== shiftId) {
            const updatedShift = {
              ...shiftData,
              id: response.data.id,
              shift_number: response.data.shift_number,
              sync_status: 'synced' as const,
            }
            await db.put('shifts', {
              ...updatedShift,
              created_at: shiftData.opened_at,
              updated_at: new Date().toISOString(),
            })
            localStorage.setItem('pos_current_shift', JSON.stringify(updatedShift))
          } else if (response.data) {
            // Update sync status even if ID matches
            // shiftId might be a string, so we need to handle it
            const existingShift = await db.get('shifts', shiftId as any)
            if (existingShift) {
              await db.put('shifts', {
                ...existingShift,
                sync_status: 'synced',
                updated_at: new Date().toISOString(),
              })
            }
          }
        }).catch((error) => {
          console.warn('Background sync failed, will retry later:', error)
          // Shift is already queued for sync, so it will retry automatically
        })
      }

      return shiftData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
  })

  // Close shift mutation - OFFLINE-FIRST: Save locally first, then sync
  const closeShiftMutation = useMutation({
    mutationFn: async (data: ShiftCloseWithInventoryRequest) => {
      if (!currentOpenShift || !currentOpenShift.id) {
        throw new Error('No open shift to close')
      }

      const db = await openDatabase()
      
      // Handle both string and number IDs
      let shiftId: number
      if (typeof currentOpenShift.id === 'string') {
        const parsed = parseInt(currentOpenShift.id.replace('shift-', ''))
        if (isNaN(parsed)) {
          throw new Error('Invalid shift ID format')
        }
        shiftId = parsed
      } else {
        shiftId = currentOpenShift.id
      }

      console.log('closing open shift', currentOpenShift)

      // OFFLINE-FIRST: Save closed shift data locally first
      const closedShift: POSDatabase['shifts']['value'] = {
        ...currentOpenShift,
        id: shiftId,
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by_user_id: user?.id,
        notes: data.notes ? `${currentOpenShift.notes || ''}\n[Closed] ${data.notes}`.trim() : currentOpenShift.notes,
        sync_status: 'pending',
        created_at: currentOpenShift.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('closed open shift B', closedShift);
      // CRITICAL: Save to IndexedDB and update status BEFORE proceeding
      await db.put('shifts', closedShift)
      
      console.log('closed open shift A', closedShift);

      // CRITICAL: Remove from localStorage immediately to ensure state is updated
      localStorage.removeItem('pos_current_shift')

      alert('closed shift:' + currentOpenShift.id)
      
      // CRITICAL: Clear the current shift from React Query cache immediately
      // This ensures currentShift becomes null and hasOpenShift becomes false
      queryClient.setQueryData(['shift', 'open', user?.store_id], null)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      queryClient.removeQueries({ queryKey: ['shift', 'open'] })

      // Add to sync queue with close data (including inventory entries)
      await addToSyncQueue(db, {
        type: 'shift',
        action: 'close' as const,
        data_id: shiftId,
        data: {
          ...closedShift,
          close_data: data, // Include inventory entries and other close data
        },
      })

      //For Agent: keep this code, do not remove it as it is for reference.
      // // Try to sync immediately if online (non-blocking)
      // if (navigator.onLine) {
      //   try {
      //     await closeShiftWithInventory(shiftId, data)
      //     // Update sync status to synced
      //     await db.put('shifts', { ...closedShift, sync_status: 'synced' })
      //     // Remove from sync queue
      //     const queue = await getSyncQueue(db)
      //     const queueItem = queue.find(item => 
      //       item.type === 'shift' && 
      //       item.action === 'close' && 
      //       item.data_id === shiftId
      //     )
      //     if (queueItem) {
      //       await removeFromSyncQueue(db, queueItem.id)
      //     }
      //   } catch (error) {
      //     // If sync fails, it will be retried by background sync
      //     console.warn('Failed to sync shift close immediately, will retry:', error)
      //   }
      // }

      return { closedShift, shiftId }
    },
    onSuccess: async (result) => {
      const { shiftId } = result
      
      // Double-check IndexedDB: Ensure shift is marked as closed
      const db = await openDatabase()
      const shift = await db.get('shifts', shiftId)
      if (shift) {
        // Ensure status is closed (should already be, but double-check)
        if (shift.status !== 'closed') {
          await db.put('shifts', { ...shift, status: 'closed' })
        }
      }
      
      // Additional cache invalidation (most updates already done in mutationFn)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
  })

  const openShift = useCallback(
    async (data: OpenShiftData) => {
      return openShiftMutation.mutateAsync(data)
    },
    [openShiftMutation]
  )

  const closeShift = useCallback(
    async (data: ShiftCloseWithInventoryRequest) => {
      return closeShiftMutation.mutateAsync(data)
    },
    [closeShiftMutation]
  )

  // Fetch inventory control config - OFFLINE-FIRST: Only reads from local database
  const fetchInventoryConfig = useCallback(
    async (_storeId: number): Promise<InventoryControlConfig[]> => {
      // Offline-first: ONLY check IndexedDB - no API calls
      const db = await openDatabase()
      const localConfigs = await getAllInventoryControlConfig(db, true) // Only show_in_inventory=true
      
      // Return local configs, sorted by priority
      // If no configs exist locally, return empty array (they should be synced during initial sync)
      return localConfigs
        .map((c) => ({
          id: c.id,
          item_type: c.item_type as 'Product' | 'Material',
          product_id: c.product_id,
          material_id: c.material_id,
          show_in_inventory: c.show_in_inventory,
          priority: c.priority,
          uofm1_id: c.uofm1_id,
          uofm2_id: c.uofm2_id,
          uofm3_id: c.uofm3_id,
          product_name: c.product_name,
          material_name: c.material_name,
          uofm1_abbreviation: c.uofm1_abbreviation,
          uofm2_abbreviation: c.uofm2_abbreviation,
          uofm3_abbreviation: c.uofm3_abbreviation,
        }))
        .sort((a, b) => a.priority - b.priority)
    },
    []
  )

  // Fetch shift inventory entries
  const fetchShiftInventory = useCallback(
    async (shiftId: number, entryType?: 'beg_bal' | 'refill' | 'end_bal'): Promise<ShiftInventoryEntryResponse[]> => {
      return getShiftInventory(shiftId, entryType)
    },
    []
  )

  // Refresh shift data manually
  const refreshShift = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['shift', 'open', user?.store_id] })
  }, [queryClient, user?.store_id])

  const hasOpenShift = !!currentOpenShift
  const isLoading = isLoadingShift || openShiftMutation.isPending || closeShiftMutation.isPending

  return {
    currentShift: currentOpenShift || null,
    hasOpenShift,
    isLoading,
    openShift,
    closeShift,
    fetchInventoryConfig,
    fetchShiftInventory,
    refreshShift,
    error: openShiftMutation.error || closeShiftMutation.error,
  }
}

