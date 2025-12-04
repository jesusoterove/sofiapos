/**
 * Language context for sofia-ui components.
 * Allows parent applications to provide language settings.
 */
import { createContext, ReactNode } from 'react'

export interface LanguageContextType {
  language: string
  changeLanguage?: (lang: string) => void
}

export const LanguageContext = createContext<LanguageContextType | null>(null)

export interface LanguageProviderProps {
  children: ReactNode
  language: string
  changeLanguage?: (lang: string) => void
}

/**
 * Language provider for sofia-ui components.
 * Should be provided by the parent application (e.g., Console app).
 */
export function LanguageProvider({ children, language, changeLanguage }: LanguageProviderProps) {
  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

