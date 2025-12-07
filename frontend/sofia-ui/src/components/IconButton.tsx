/**
 * Button component.
 */
import React from 'react'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
  title?: string
}

export function IconButton({ variant = 'primary', children, className = '', title, ...props }: IconButtonProps) {
  const baseStyles = 'p-0 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'text-white',
    secondary: 'border',
    danger: 'text-white bg-red-600 hover:bg-red-700',
  }
  
  const style = variant === 'primary' 
    ? { backgroundColor: 'var(--color-primary-500)' }
    : variant === 'secondary'
    ? { 
        backgroundColor: 'transparent',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-primary)'
      }
    : {}
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      title={title}
      {...props}
    >
      {children}
    </button>
  )
}
