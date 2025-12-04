/**
 * Time cell renderer for DataGrid.
 */
import React from 'react'
import { useTranslation } from '../../i18n/hooks'

export interface TimeCellRendererProps {
  value: string | Date | null | undefined
  format?: 'short' | 'medium' | 'long' | string
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function TimeCellRenderer({ 
  value, 
  format = 'short',
  align = 'left',
  className = '',
  style = {}
}: TimeCellRendererProps) {
  const { currentLanguage } = useTranslation()
  
  let displayValue: string = '-'
  
  if (value) {
    try {
      const date = typeof value === 'string' ? new Date(value) : value
      if (!isNaN(date.getTime())) {
        // If format is a custom string, use it directly
        if (typeof format === 'string' && format !== 'short' && format !== 'medium' && format !== 'long') {
          // Custom format string (e.g., "HH:mm:ss")
          // For now, use Intl.DateTimeFormat, but could be extended with a date formatting library
          const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: format.includes('ss') ? '2-digit' : undefined,
            hour12: format.includes('a') || format.includes('A'),
          }
          displayValue = date.toLocaleTimeString(currentLanguage, options)
        } else {
          // Predefined formats
          const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
          }
          
          if (format === 'long') {
            options.second = '2-digit'
          }
          
          displayValue = date.toLocaleTimeString(currentLanguage, options)
        }
      }
    } catch (e) {
      // Invalid date, keep default '-'
    }
  }
  
  return (
    <span 
      className={className}
      style={{ 
        color: 'var(--color-text-primary)',
        textAlign: align,
        display: 'block',
        ...style 
      }}
    >
      {displayValue}
    </span>
  )
}

