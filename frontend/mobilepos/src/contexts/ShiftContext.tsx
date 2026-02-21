import { createContext, useContext, type ReactNode } from 'react'
import { useShiftManagement, type Shift, type OpenShiftData, type CloseShiftData } from '@/hooks/useShiftManagement'

interface ShiftContextValue {
  currentShift: Shift | null
  hasOpenShift: boolean
  isLoading: boolean
  error: Error | null
  openShift: (data: OpenShiftData) => Promise<Shift>
  closeShift: (data: CloseShiftData) => Promise<void>
  refreshShift: () => Promise<void>
}

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined)

export function ShiftProvider({ children }: { children: ReactNode }) {
  const shift = useShiftManagement()
  return <ShiftContext.Provider value={shift}>{children}</ShiftContext.Provider>
}

export function useShift() {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error('useShift must be used within a ShiftProvider')
  return ctx
}
