/**
 * Spinner component for loading states.
 */
import React from 'react'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

export function Spinner({ size = 'md', className = '', color }: SpinnerProps) {
  const spinnerColor = color || 'var(--color-primary-500, #3B82F6)'

  return (
    <div
      className={`
        inline-block animate-spin rounded-full border-solid border-t-transparent
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        borderColor: `${spinnerColor} transparent transparent transparent`,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

