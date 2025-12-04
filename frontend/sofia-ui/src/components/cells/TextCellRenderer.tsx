/**
 * Text cell renderer for DataGrid.
 * Left-aligned by default, but alignment can be customized.
 */
import React from 'react'

export interface TextCellRendererProps {
  value: string | null | undefined
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
  // Additional options can be added here if needed
}

export function TextCellRenderer({ 
  value, 
  align = 'left',
  className = '',
  style = {}
}: TextCellRendererProps) {
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
      {value || '-'}
    </span>
  )
}

