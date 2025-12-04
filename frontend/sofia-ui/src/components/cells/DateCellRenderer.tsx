/**
 * Date cell renderer for DataGrid.
 */
import React from 'react'
import { useTranslation } from '../../i18n/hooks'

export interface DateCellRendererProps {
  value: string | Date | null | undefined
  format?: 'short' | 'medium' | 'long' | 'full' | string
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function DateCellRenderer({ 
  value, 
  format = 'short',
  align = 'left',
  className = '',
  style = {}
}: DateCellRendererProps) {
  const { currentLanguage } = useTranslation()
  
  let displayValue: string = '-'
  
  if (value) {
    try {
      const date = typeof value === 'string' ? new Date(value) : value
      if (!isNaN(date.getTime())) {
        // If format is a custom string, use it directly
        if (typeof format === 'string' && format !== 'short' && format !== 'medium' && format !== 'long' && format !== 'full') {
          // Custom format string (e.g., "yyyy-MM-dd")
          // For now, use Intl.DateTimeFormat, but could be extended with a date formatting library
          const options: Intl.DateTimeFormatOptions = {
            year: format.includes('yyyy') ? 'numeric' : format.includes('yy') ? '2-digit' : undefined,
            month: format.includes('MMMM') ? 'long' : format.includes('MMM') ? 'short' : format.includes('MM') ? '2-digit' : 'numeric',
            day: format.includes('dd') ? '2-digit' : 'numeric',
          }
          displayValue = date.toLocaleDateString(currentLanguage, options)
        } else {
          // Predefined formats
          const options: Intl.DateTimeFormatOptions = {
            year: format === 'short' ? '2-digit' : 'numeric',
            month: format === 'short' ? '2-digit' : format === 'medium' ? 'short' : 'long',
            day: '2-digit',
          }
          
          if (format === 'full') {
            options.weekday = 'long'
          }
          
          displayValue = date.toLocaleDateString(currentLanguage, options)
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

