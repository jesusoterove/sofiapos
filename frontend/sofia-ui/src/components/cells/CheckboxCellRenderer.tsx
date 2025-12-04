/**
 * Checkbox cell renderer for boolean values in DataGrid.
 */
import React from 'react'

export interface CheckboxCellRendererProps {
  value: boolean | null | undefined
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

export function CheckboxCellRenderer({ 
  value, 
  align = 'center',
  className = '',
  style = {},
  disabled = false,
  onChange
}: CheckboxCellRendererProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !disabled) {
      onChange(e.target.checked)
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
      <input
        type="checkbox"
        checked={value === true}
        disabled={disabled}
        onChange={handleChange}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      />
    </span>
  )
}

