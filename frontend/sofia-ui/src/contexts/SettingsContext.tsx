/**
 * Settings context for sofia-ui components.
 * Allows parent applications to provide settings (e.g., money decimal places).
 */
import { createContext, ReactNode } from 'react'

export interface SettingsContextType {
  moneyDecimalPlaces?: number
}

export const SettingsContext = createContext<SettingsContextType | null>(null)

export interface SettingsProviderProps {
  children: ReactNode
  moneyDecimalPlaces?: number
}

/**
 * Settings provider for sofia-ui components.
 * Should be provided by the parent application (e.g., Console app).
 */
export function SettingsProvider({ children, moneyDecimalPlaces }: SettingsProviderProps) {
  return (
    <SettingsContext.Provider value={{ moneyDecimalPlaces }}>
      {children}
    </SettingsContext.Provider>
  )
}

