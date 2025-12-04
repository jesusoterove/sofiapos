/**
 * Number cell renderer for DataGrid.
 * Right-aligned by default, but alignment can be customized.
 */
import React from 'react'

export interface NumberCellRendererProps {
  value: number | string | null | undefined
  align?: 'left' | 'center' | 'right'
  decimals?: number
  decPlaces?: number // Alias for decimals (for cellRendererOptions compatibility)
  prefix?: string
  suffix?: string
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
  className = '',
  style = {}
}: NumberCellRendererProps) {
  // Use decPlaces if provided (from cellRendererOptions), otherwise use decimals, default to 2
  const decimalPlaces = decPlaces !== undefined ? decPlaces : (decimals !== undefined ? decimals : 2)
  
  let displayValue: string = '-'
  
  if (value !== null && value !== undefined) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(numValue)) {
      displayValue = numValue.toFixed(decimalPlaces)
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
      {prefix}{displayValue}{suffix}
    </span>
  )
}

