/**
 * Number cell renderer for DataGrid.
 * Right-aligned by default, but alignment can be customized.
 * Supports money formatting via formatAsMoney prop.
 */
import React from 'react'

export interface NumberCellRendererProps {
  value: number | string | null | undefined
  align?: 'left' | 'center' | 'right'
  decimals?: number
  decPlaces?: number // Alias for decimals (for cellRendererOptions compatibility)
  prefix?: string
  suffix?: string
  formatAsMoney?: boolean // Format as currency
  currency?: string // Currency code (e.g., 'USD', 'EUR'). Defaults to 'USD'
  locale?: string // Locale for currency formatting (e.g., 'en-US', 'es-ES'). Defaults to 'en-US'
  className?: string
  style?: React.CSSProperties
}

export function NumberCellRenderer({ 
  value, 
  align = 'right',
  decimals,
  decPlaces,
  prefix = '',
  suffix = '',
  formatAsMoney = false,
  currency = 'USD',
  locale = 'en-US',
  className = '',
  style = {}
}: NumberCellRendererProps) {
  // Use decPlaces if provided (from cellRendererOptions), otherwise use decimals, default to 2
  const decimalPlaces = decPlaces !== undefined ? decPlaces : (decimals !== undefined ? decimals : 2)
  
  let displayValue: string = '-'
  
  if (value !== null && value !== undefined) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(numValue)) {
      if (formatAsMoney) {
        // Format as currency using Intl.NumberFormat
        displayValue = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(numValue)
      } else {
        // Format as regular number
        displayValue = numValue.toFixed(decimalPlaces)
      }
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
      {formatAsMoney ? displayValue : `${prefix}${displayValue}${suffix}`}
    </span>
  )
}

