/**
 * Input component for text, number, and other input types.
 */
import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full px-4 py-2 rounded-lg border transition-colors
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          style={{
            borderColor: error ? '#EF4444' : 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
          {helperText}
        </p>
      )}
    </div>
  )
}

