/**
 * Hook for shift management.
 */
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/api/client'
import { openDatabase, addToSyncQueue } from '@/db'

export interface Shift {
  id: number
  shift_number: string
  status: 'open' | 'closed'
  store_id: number
  opened_at: string
  closed_at?: string
}

export interface OpenShiftData {
  initialCash: number
  inventoryBalance?: number
}

export function useShift() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Check for open shift
  const { data: currentOpenShift, isLoading: isLoadingShift } = useQuery({
    queryKey: ['shift', 'open', user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return null

      try {
        const response = await apiClient.get(`/api/v1/shifts/open?store_id=${user.store_id}`)
        return response.data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null // No open shift
        }
        throw error
      }
    },
    enabled: !!user?.store_id && navigator.onLine,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Open shift mutation
  const openShiftMutation = useMutation({
    mutationFn: async (data: OpenShiftData) => {
      if (!user?.store_id) {
        throw new Error('User must be assigned to a store')
      }

      // Try online first
      if (navigator.onLine) {
        try {
          const response = await apiClient.post('/api/v1/shifts/open', {
            store_id: user.store_id,
            initial_cash: data.initialCash,
            inventory_balance: data.inventoryBalance,
          })
          // Store shift locally
          localStorage.setItem('pos_current_shift', JSON.stringify(response.data))
          return response.data
        } catch (error: any) {
          // If online fails, queue for sync
          console.warn('Failed to open shift online, queuing for sync:', error)
          // Continue to offline handling
        }
      }

      // Offline: Save to local storage and queue for sync
      const db = await openDatabase()
      const shiftData = {
        id: `shift-${Date.now()}`,
        shift_number: `SHIFT-${Date.now()}`,
        store_id: user.store_id,
        status: 'open',
        opened_at: new Date().toISOString(),
        initial_cash: data.initialCash,
        inventory_balance: data.inventoryBalance,
      }

      // Store locally
      localStorage.setItem('pos_current_shift', JSON.stringify(shiftData))

      // Queue for sync
      await addToSyncQueue(db, {
        type: 'shift',
        action: 'create',
        data_id: shiftData.id,
        data: shiftData,
      })

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

