/**
 * Card component for containing content sections.
 */
import React from 'react'

export interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  children,
  title,
  className = '',
  padding = 'md',
  shadow = true,
}: CardProps) {
  return (
    <div
      className={`
        rounded-lg border
        ${shadow ? 'shadow-sm' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
        borderColor: 'var(--color-border-default, #E5E7EB)',
      }}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

