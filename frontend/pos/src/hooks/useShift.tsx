/**
 * Hook for shift management - offline-first.
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/api/client'
import { openDatabase, saveShift, getOpenShift } from '@/db'

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

export function useShift() {
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
            const existingShift = await db.get('shifts', shiftId)
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

  const openShift = useCallback(
    async (data: OpenShiftData) => {
      return openShiftMutation.mutateAsync(data)
    },
    [openShiftMutation]
  )

  return {
    currentShift: currentOpenShift || null,
    hasOpenShift: !!currentOpenShift,
    isLoading: isLoadingShift || openShiftMutation.isPending,
    openShift,
    error: openShiftMutation.error,
  }
}

