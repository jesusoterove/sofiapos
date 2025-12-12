/**
 * Hook for shift management - optimized for context usage.
 * This is the internal hook used by ShiftContext.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/api/client'
import { openDatabase, saveShift, getOpenShift } from '@/db'
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

  // Close shift mutation
  const closeShiftMutation = useMutation({
    mutationFn: async (data: ShiftCloseWithInventoryRequest) => {
      if (!currentOpenShift || !currentOpenShift.id) {
        throw new Error('No open shift to close')
      }
      // Handle both string and number IDs
      let shiftId: number
      if (typeof currentOpenShift.id === 'string') {
        // Try to parse if it's a numeric string, otherwise use a fallback
        const parsed = parseInt(currentOpenShift.id.replace('shift-', ''))
        if (isNaN(parsed)) {
          throw new Error('Invalid shift ID format')
        }
        shiftId = parsed
      } else {
        shiftId = currentOpenShift.id
      }
      return closeShiftWithInventory(shiftId, data)
    },
    onSuccess: async () => {
      // Clear local shift data immediately
      localStorage.removeItem('pos_current_shift')
      
      // Also clear from IndexedDB
      if (currentOpenShift?.id) {
        try {
          const db = await openDatabase()
          const shiftId = typeof currentOpenShift.id === 'string' 
            ? parseInt(currentOpenShift.id.replace('shift-', '')) 
            : currentOpenShift.id
          await db.delete('shifts', shiftId)
        } catch (error) {
          console.warn('Failed to delete shift from IndexedDB:', error)
        }
      }
      
      // Invalidate queries to update hasOpenShift to false
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      // Set query data to null immediately to ensure hasOpenShift becomes false
      queryClient.setQueryData(['shift', 'open', user?.store_id], null)
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

