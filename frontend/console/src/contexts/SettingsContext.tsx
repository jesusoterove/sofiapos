/**
 * Settings context for managing application settings.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getGlobalSettings } from '@/api/settings'
import { SettingsProvider as SofiaUISettingsProvider } from '@sofiapos/ui'
import { setPersistedLanguage } from '@/i18n'

interface SettingsContextType {
  moneyDecimalPlaces: number
  isLoading: boolean
  settings: Record<string, any> | null
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [moneyDecimalPlaces, setMoneyDecimalPlaces] = useState<number>(2) // Default to 2

  // Fetch global settings (only if authenticated)
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: getGlobalSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    enabled: typeof window !== 'undefined' && window.location.pathname !== '/login', // Don't fetch on login page
  })

  // Update money decimal places when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      const decimalPlaces = settingsData.settings.money_decimal_places
      if (typeof decimalPlaces === 'number') {
        setMoneyDecimalPlaces(decimalPlaces)
      } else if (typeof decimalPlaces === 'string') {
        const parsed = parseInt(decimalPlaces, 10)
        if (!isNaN(parsed)) {
          setMoneyDecimalPlaces(parsed)
        }
      }
    }
  }, [settingsData])

  // Apply default_language from server when user has not set a language preference
  // Only runs once when settings are first loaded and no user preference exists
  useEffect(() => {
    if (!settingsData?.settings?.default_language) return
    const lang = String(settingsData.settings.default_language).trim().toLowerCase()
    if (lang !== 'en' && lang !== 'es') return
    
    // Only apply server default if user hasn't set a preference
    // Check both localStorage and current i18n language to avoid race conditions
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('i18nextLng')
      if (!storedLang) {
        // User hasn't set a preference, use server default and persist it
        setPersistedLanguage(lang)
      }
    }
  }, [settingsData])

  return (
    <SettingsContext.Provider
      value={{
        moneyDecimalPlaces,
        isLoading,
        settings: settingsData?.settings || null,
      }}
    >
      <SofiaUISettingsProvider moneyDecimalPlaces={moneyDecimalPlaces}>
        {children}
      </SofiaUISettingsProvider>
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

