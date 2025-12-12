/**
 * Hook for shift management - backward compatibility wrapper.
 * 
 * @deprecated This hook is maintained for backward compatibility.
 * New code should use `useShiftContext()` from `@/contexts/ShiftContext` instead.
 * 
 * This hook re-exports from ShiftContext to maintain compatibility with existing code.
 */
export { useShift } from '@/contexts/ShiftContext'
export type { Shift, OpenShiftData } from '@/hooks/useShiftManagement'

