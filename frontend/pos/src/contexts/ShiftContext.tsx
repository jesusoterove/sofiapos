/**
 * Context provider for shift management.
 * This ensures the shift state persists across navigation and provides a single source of truth.
 */
import { createContext, useContext, ReactNode } from 'react'
import { useShiftManagement, type Shift, type OpenShiftData } from '@/hooks/useShiftManagement'
import type { InventoryControlConfig } from '@/api/inventoryControl'
import type { ShiftInventoryEntryResponse } from '@/api/shifts'
import type { ShiftCloseWithInventoryRequest } from '@/api/inventoryControl'

interface ShiftContextValue {
  // State
  currentShift: Shift | null
  hasOpenShift: boolean
  isLoading: boolean
  error: Error | null
  
  // Operations
  openShift: (data: OpenShiftData) => Promise<Shift>
  closeShift: (data: ShiftCloseWithInventoryRequest) => Promise<void>
  fetchInventoryConfig: (storeId: number) => Promise<InventoryControlConfig[]>
  fetchShiftInventory: (shiftId: number, entryType?: 'beg_bal' | 'refill' | 'end_bal') => Promise<ShiftInventoryEntryResponse[]>
  
  // Utilities
  refreshShift: () => Promise<void>
}

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined)

interface ShiftProviderProps {
  children: ReactNode
}

export function ShiftProvider({ children }: ShiftProviderProps) {
  const shiftManagement = useShiftManagement()

  return (
    <ShiftContext.Provider value={shiftManagement}>
      {children}
    </ShiftContext.Provider>
  )
}

export function useShiftContext() {
  const context = useContext(ShiftContext)
  if (context === undefined) {
    throw new Error('useShiftContext must be used within a ShiftProvider')
  }
  return context
}

// Backward compatibility: Export useShift as an alias to useShiftContext
// This allows gradual migration of components
export function useShift() {
  return useShiftContext()
}

