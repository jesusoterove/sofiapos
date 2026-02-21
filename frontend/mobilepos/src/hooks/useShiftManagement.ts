import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  openDatabase, saveShift, getOpenShift, addToSyncQueue,
} from '@/db'
import { getRegistration, type RegistrationData } from '@/utils/registration'
import { isOnline } from '@/utils/network'
import apiClient from '@/api/client'

export interface Shift {
  id: number
  shift_number: string
  status: 'open' | 'closed'
  store_id: number
  opened_at: string
  closed_at?: string | null
  opened_by_user_id?: number | null
  closed_by_user_id?: number | null
  initial_cash?: number | null
  inventory_balance?: number | null
  notes?: string | null
  sync_status: string
  created_at: string
  updated_at: string
}

export interface OpenShiftData {
  initialCash: number
  notes?: string
}

export interface CloseShiftData {
  notes?: string
}

async function generateShiftNumber(cashRegisterId: number, cashRegisterCode: string, storeId: number): Promise<string> {
  const db = await openDatabase()
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  const row = await db.getFirstAsync<{ sequence_number: number }>(
    `SELECT sequence_number FROM sequences WHERE cash_register_id = ? AND doc_type = 'shift' AND date = ?`,
    [cashRegisterId, dateStr]
  )
  const seq = (row?.sequence_number ?? 0) + 1
  await db.runAsync(
    `INSERT OR REPLACE INTO sequences (id, cash_register_id, doc_type, date, sequence_number, updated_at)
     VALUES (?, ?, 'shift', ?, ?, ?)`,
    [`${cashRegisterId}-shift-${dateStr}`, cashRegisterId, dateStr, seq, now.toISOString()]
  )
  return `SH${cashRegisterCode}-${dateStr}${String(seq).padStart(2, '0')}`
}

export function useShiftManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [reg, setReg] = useState<RegistrationData | null>(null)
  useEffect(() => {
    getRegistration().then(setReg)
  }, [])

  const cashRegisterId = reg?.cashRegisterId
  const cashRegisterCode = reg?.cashRegisterCode ?? 'M01'
  const storeId = user?.store_id ?? reg?.storeId ?? 1

  const { data: currentShift = null, isLoading: isLoadingShift } = useQuery({
    queryKey: ['shift', 'open', storeId],
    queryFn: async (): Promise<Shift | null> => {
      const db = await openDatabase()
      const dbShift = await getOpenShift(db, storeId)

      if (dbShift && dbShift.status === 'open') {
        return dbShift as unknown as Shift
      }

      if (await isOnline()) {
        try {
          const response = await apiClient.get('/api/v1/shifts/open', {
            params: { cash_register_id: cashRegisterId },
          })
          if (response.data && response.data.status === 'open') {
            await saveShift(db, { ...response.data, sync_status: 'synced' })
            return response.data as Shift
          }
        } catch {
          // offline or API error — fall through
        }
      }

      return null
    },
    enabled: !!storeId,
    staleTime: 30_000,
    placeholderData: (prev: Shift | null | undefined) => prev ?? null,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const openShiftMutation = useMutation({
    mutationFn: async (data: OpenShiftData): Promise<Shift> => {
      if (!storeId) throw new Error('User must be assigned to a store')

      const db = await openDatabase()
      const shiftNumber = await generateShiftNumber(
        cashRegisterId ?? 0,
        cashRegisterCode,
        storeId
      )

      const shiftData = {
        shift_number: shiftNumber,
        id: 0,
        store_id: storeId,
        status: 'open' as const,
        opened_at: new Date().toISOString(),
        closed_at: null,
        opened_by_user_id: user?.id ?? null,
        closed_by_user_id: null,
        initial_cash: data.initialCash,
        inventory_balance: null,
        notes: data.notes ?? null,
        sync_status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await saveShift(db, shiftData)

      await addToSyncQueue(db, {
        type: 'shift',
        action: 'create',
        data_id: shiftNumber,
        data: JSON.stringify(shiftData),
        retry_count: 0,
        created_at: new Date().toISOString(),
      })

      return shiftData as Shift
    },
    onSuccess: (shiftData) => {
      queryClient.setQueryData(['shift', 'open', storeId], shiftData)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
  })

  const closeShiftMutation = useMutation({
    mutationFn: async (data: CloseShiftData): Promise<void> => {
      if (!currentShift?.shift_number) throw new Error('No open shift to close')

      const db = await openDatabase()

      const closedShift = {
        ...currentShift,
        status: 'closed' as const,
        closed_at: new Date().toISOString(),
        closed_by_user_id: user?.id ?? null,
        notes: data.notes
          ? `${currentShift.notes || ''}\n[Closed] ${data.notes}`.trim()
          : currentShift.notes,
        sync_status: 'pending' as const,
        updated_at: new Date().toISOString(),
      }

      await saveShift(db, closedShift as any)

      await addToSyncQueue(db, {
        type: 'shift',
        action: 'close',
        data_id: closedShift.shift_number,
        data: JSON.stringify(closedShift),
        retry_count: 0,
        created_at: new Date().toISOString(),
      })

      queryClient.setQueryData(['shift', 'open', storeId], null)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
  })

  const openShift = useCallback(
    (data: OpenShiftData) => openShiftMutation.mutateAsync(data),
    [openShiftMutation]
  )

  const closeShift = useCallback(
    (data: CloseShiftData) => closeShiftMutation.mutateAsync(data),
    [closeShiftMutation]
  )

  const refreshShift = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['shift', 'open', storeId] })
  }, [queryClient, storeId])

  const hasOpenShift = !!currentShift
  const isLoadingOp = openShiftMutation.isPending || closeShiftMutation.isPending

  return {
    currentShift,
    hasOpenShift,
    isLoading: isLoadingShift || isLoadingOp,
    error: openShiftMutation.error || closeShiftMutation.error,
    openShift,
    closeShift,
    refreshShift,
  }
}
