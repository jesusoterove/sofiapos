/**
 * Yes/No cell renderer for boolean values in DataGrid.
 */
import React from 'react'
import { useTranslation } from '../../i18n/hooks'

export interface YesNoCellRendererProps {
  value: boolean | null | undefined
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function YesNoCellRenderer({ 
  value, 
  align = 'center',
  className = '',
  style = {}
}: YesNoCellRendererProps) {
  const { t } = useTranslation()
  
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
      {value === true ? t('common.yes') : value === false ? t('common.no') : '-'}
    </span>
  )
}

