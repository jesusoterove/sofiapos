/**
 * Hook for shift management - optimized for context usage.
 * This is the internal hook used by ShiftContext.
 */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/api/client'
import { openDatabase, saveShift, getOpenShift, addToSyncQueue, removeFromSyncQueue, getSyncQueue } from '@/db'
import { getShiftByNumber } from '@/db/queries/shifts'
import type { POSDatabase } from '@/db'
import { getAllInventoryControlConfig } from '@/db/queries/inventoryControlConfig'
import type { InventoryControlConfig } from '@/api/inventoryControl'
import { getShiftInventory, type ShiftInventoryEntryResponse } from '@/api/shifts'
import type { ShiftCloseWithInventoryRequest } from '@/api/inventoryControl'
import { generateShiftNumber } from '@/utils/documentNumbers'
import { getRegistration } from '@/utils/registration'
import { initializeShiftSummary } from '@/services/shiftSummary'

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
  beginningBalances?: Array<{ item_id: number; item_type: 'Product' | 'Material'; uofm_id: number; quantity: number }>
}

export function useShiftManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Check for open shift - offline-first: check local first, then API
  // Get cash register ID from registration
  const registration = getRegistration()
  const cashRegisterId = registration?.cashRegisterId
  
  const { data: currentOpenShift, isLoading: isLoadingShift } = useQuery({
    queryKey: ['shift', 'open', cashRegisterId],
    queryFn: async () => {
      if (!cashRegisterId) {
        console.warn('[useShiftManagement] No cash register ID found in registration')
        return null
      }

      // ALWAYS check local storage first (offline-first)
      const localShift = localStorage.getItem('pos_current_shift')
      if (localShift) {
        try {
          const parsed = JSON.parse(localShift)
          // Verify it's open
          if (parsed.status === 'open') {
            return parsed
          }
        } catch (e) {
          console.error('Failed to parse local shift:', e)
        }
      }

      // Also check IndexedDB
      // Note: Local getOpenShift uses store_id since IndexedDB schema stores store_id
      // For now, we'll use store_id from user (shifts are associated with stores, cash registers belong to stores)
      const db = await openDatabase()
      const dbShift = user?.store_id ? await getOpenShift(db, user.store_id) : null
      if (dbShift && dbShift.status === 'open') {
        // Update localStorage for quick access (only if shift is open)
        localStorage.setItem('pos_current_shift', JSON.stringify(dbShift))
        return dbShift
      } else if (dbShift && dbShift.status !== 'open') {
        // If shift exists but is closed, ensure localStorage is cleared
        localStorage.removeItem('pos_current_shift')
      }

      // If no local shift, try API (only if online)
      if (navigator.onLine) {
        try {
          const response = await apiClient.get(`/api/v1/shifts/open`, {
            params: { cash_register_id: cashRegisterId },
          })
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
    enabled: !!cashRegisterId,
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
      
      // Get cash register code and ID for shift number generation
      const registration = getRegistration()
      if (!registration?.cashRegisterId) {
        throw new Error('Cash register not registered. Please complete registration first.')
      }
      
      let cashRegisterCode = registration.cashRegisterCode
      const cashRegisterId = registration.cashRegisterId
      
      // Fetch cash register code from API if not in registration
      if (!cashRegisterCode) {
        try {
          const response = await apiClient.get(`/api/v1/cash_registers/${cashRegisterId}`)
          cashRegisterCode = response.data.code
          // Store in registration for future use
          const updatedRegistration = { ...registration, cashRegisterCode }
          const { saveRegistration } = await import('@/utils/registration')
          saveRegistration(updatedRegistration as any)
        } catch (error) {
          console.error('[useShiftManagement] Failed to fetch cash register code:', error)
          throw new Error('Failed to fetch cash register code. Please ensure you are online and try again.')
        }
      }
      
      // Generate shift number according to plan: [shift_prefix][cash_register_code]-[base36(MMddyyyyxx)]
      if (!cashRegisterCode) {
        throw new Error('Cash register code is required to generate shift number')
      }
      const shiftNumber = await generateShiftNumber(cashRegisterId, cashRegisterCode, user.store_id)
      
      // Use id = 0 for unsynced records (will be updated after sync)
      const shiftData: POSDatabase['shifts']['value'] = {
        id: 0, // Always 0 for unsynced records
        shift_number: shiftNumber, // Generated locally using sequences table
        store_id: user.store_id,
        status: 'open' as const,
        opened_at: new Date().toISOString(),
        initial_cash: data.initialCash,
        inventory_balance: data.inventoryBalance,
        opened_by_user_id: user.id,
        sync_status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Save to IndexedDB (saveShift already adds to sync queue)
      await saveShift(db, shiftData)

      // Also store in localStorage for quick access
      localStorage.setItem('pos_current_shift', JSON.stringify(shiftData))
      
      // Initialize shift summary - CRITICAL: Must be created when shift opens
      // This MUST succeed for the shift to function properly
      try {
        // Get beginning balances from data if available (from OpenShiftPage)
        const beginningBalances = data.beginningBalances || []
        console.log('[useShiftManagement] Initializing shift summary for shift:', shiftNumber, 'with beginningBalances:', beginningBalances.length)
        
        await initializeShiftSummary(shiftNumber, {
          opened_at: shiftData.opened_at,
          initial_cash: data.initialCash,
        }, beginningBalances)
        
        // Verify the summary was created
        const db = await openDatabase()
        const { getShiftSummary } = await import('../db/queries/shiftSummaries')
        const verifySummary = await getShiftSummary(db, shiftNumber)
        
        if (!verifySummary) {
          throw new Error(`Shift summary was not created for shift ${shiftNumber}`)
        }
        
        console.log('[useShiftManagement] Shift summary initialized and verified successfully')
      } catch (error) {
        console.error('[useShiftManagement] CRITICAL: Failed to initialize shift summary:', error)
        // Log the full error for debugging
        if (error instanceof Error) {
          console.error('[useShiftManagement] Error details:', error.message, error.stack)
        }
        // This is a critical error - the shift summary is required for proper operation
        // We'll still allow the shift to open, but log a severe warning
        console.error('[useShiftManagement] SEVERE WARNING: Shift opened but summary initialization failed - shift summary will not be available!')
        // Re-throw to make it more visible, but don't fail the shift open
        // The safeguard in updateShiftSummaryOnPayment will try to create it later
      }
      
      // Try to sync in background if online (don't wait for it)
      // The sync manager will handle this automatically, but we can also try immediately
      //For Agent: keep this code, do not remove it as it is for reference.
      // if (navigator.onLine) {
      //   // Fire and forget - sync will happen in background via sync manager
      //   // But we can also try immediately for better UX
      //   apiClient.post('/api/v1/shifts/open', {
      //     cash_register_id: cashRegisterId, // Use cash_register_id instead of store_id
      //     initial_cash: data.initialCash,
      //     inventory_balance: data.inventoryBalance,
      //     shift_number: shiftNumber, // Send locally generated shift_number
      //   }).then(async (response) => {
      //     // Update local shift with server ID (should be different from 0)
      //     if (response.data && response.data.id && response.data.id !== 0) {
      //       // Update existing record (shift_number is primary key, so put() will update)
      //       const updatedShift: POSDatabase['shifts']['value'] = {
      //         ...shiftData,
      //         shift_number: shiftNumber, // PRIMARY KEY - keep local shift_number
      //         id: response.data.id, // Server-generated ID (for remote sync)
      //         sync_status: 'synced' as const,
      //         updated_at: new Date().toISOString(),
      //       }
            
      //       // Update using shift_number as key (primary key)
      //       await db.put('shifts', updatedShift)
      //       localStorage.setItem('pos_current_shift', JSON.stringify(updatedShift))
            
      //       // CRITICAL: Update currentOpenShift query data with the synced shift (with server ID)
      //       queryClient.setQueryData(['shift', 'open', user?.store_id], updatedShift as any)
            
      //       // Remove from sync queue (using shift_number as identifier)
      //       const queue = await getSyncQueue(db)
      //       const queueItem = queue.find(item => 
      //         item.type === 'shift' && 
      //         item.action === 'create' && 
      //         item.data_id === shiftNumber
      //       )
      //       if (queueItem) {
      //         await removeFromSyncQueue(db, queueItem.id)
      //       }
      //     }
      //   }).catch((error) => {
      //     console.warn('Background sync failed, will retry later:', error)
      //     // Shift is already queued for sync, so it will retry automatically
      //   })
      // }

      return shiftData
    },
    onSuccess: async (shiftData) => {
      // CRITICAL: Immediately update currentOpenShift query data with the newly created shift
      // This ensures currentOpenShift is available immediately without waiting for query refetch
      queryClient.setQueryData(['shift', 'open', cashRegisterId], shiftData as any)
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
  })

  // Close shift mutation - OFFLINE-FIRST: Save locally first, then sync
  const closeShiftMutation = useMutation({
    mutationFn: async (data: ShiftCloseWithInventoryRequest) => {
      if (!currentOpenShift || !currentOpenShift.shift_number) {
        throw new Error('No open shift to close')
      }

      const db = await openDatabase()
      
      // LOCAL OPERATION: Always find shift by shift_number (not by id)
      // This ensures we find the shift even if id is 0 (unsynced)
      const shiftToClose = await getShiftByNumber(db, currentOpenShift.shift_number)
      
      if (!shiftToClose) {
        throw new Error(`Shift with number '${currentOpenShift.shift_number}' not found in local database`)
      }
      
      if (shiftToClose.status !== 'open') {
        throw new Error(`Shift '${currentOpenShift.shift_number}' is not open`)
      }

      console.log('closing open shift', shiftToClose)

      // OFFLINE-FIRST: Save closed shift data locally first
      // Keep the existing id (may be 0 if unsynced, or a number if synced)
      const closedShift: POSDatabase['shifts']['value'] = {
        ...shiftToClose,
        id: shiftToClose.id, // Keep existing id (0 or synced id)
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by_user_id: user?.id,
        notes: data.notes ? `${shiftToClose.notes || ''}\n[Closed] ${data.notes}`.trim() : shiftToClose.notes,
        sync_status: 'pending',
        created_at: shiftToClose.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('closed open shift B', closedShift);
      
      // CRITICAL: Save to IndexedDB using shift_number as primary key
      // put() will automatically update the existing record with the same shift_number
      await db.put('shifts', closedShift)
      
      console.log('closed open shift A', closedShift);

      // CRITICAL: Remove from localStorage immediately to ensure state is updated
      localStorage.removeItem('pos_current_shift')

      // CRITICAL: Clear the current shift from React Query cache immediately
      // This ensures currentShift becomes null and hasOpenShift becomes false
      queryClient.setQueryData(['shift', 'open', cashRegisterId], null)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      queryClient.removeQueries({ queryKey: ['shift', 'open'] })

      // Add to sync queue with close data (including inventory entries)
      // Use shift_number for local queue identification (primary key)
      // The sync process will use the id when syncing to remote (id=0 means create, id!=0 means update)
      await addToSyncQueue(db, {
        type: 'shift',
        action: 'close' as const,
        data_id: closedShift.shift_number, // Use shift_number for local queue identification
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

      return { closedShift }
    },
    onSuccess: async (result) => {
      const { closedShift } = result
      
      // Double-check IndexedDB: Ensure shift is marked as closed
      const db = await openDatabase()
      // Use shift_number as primary key (string key)
      const shift = await db.get('shifts', closedShift.shift_number as any)
      
      if (shift) {
        // Ensure status is closed (should already be, but double-check)
        if (shift.status !== 'closed') {
          await db.put('shifts', { ...shift, status: 'closed' })
        }
      }
      
      // CRITICAL: Ensure localStorage is cleared (backup check)
      // This ensures that even if something went wrong in mutationFn, we clear it here
      const currentShiftInStorage = localStorage.getItem('pos_current_shift')
      if (currentShiftInStorage) {
        try {
          const parsed = JSON.parse(currentShiftInStorage)
          // If the stored shift matches the closed shift, remove it
          if (parsed.shift_number === closedShift.shift_number || parsed.status === 'closed') {
            localStorage.removeItem('pos_current_shift')
            console.log('[closeShiftMutation.onSuccess] Removed closed shift from localStorage')
          }
        } catch (e) {
          // If parsing fails, remove it anyway to be safe
          localStorage.removeItem('pos_current_shift')
          console.log('[closeShiftMutation.onSuccess] Removed invalid shift data from localStorage')
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
    await queryClient.invalidateQueries({ queryKey: ['shift', 'open', cashRegisterId] })
  }, [queryClient, cashRegisterId])

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

