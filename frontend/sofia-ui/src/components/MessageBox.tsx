/**
 * MessageBox component for displaying alerts, confirmations, and custom dialogs.
 */
import React, { useEffect } from 'react'
import { Button } from './Button'

export type MessageBoxType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'custom'

export interface MessageBoxButton {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  onClick: () => void
  autoFocus?: boolean
}

export interface MessageBoxProps {
  /** Whether the message box is visible */
  open: boolean
  /** Callback when the message box should close */
  onClose: () => void
  /** Title of the message box */
  title?: string
  /** Main message content */
  message: string | React.ReactNode
  /** Type of message box (affects default styling and buttons) */
  type?: MessageBoxType
  /** Custom buttons (overrides default buttons based on type) */
  buttons?: MessageBoxButton[]
  /** Show close button (X) in header */
  showCloseButton?: boolean
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean
  /** Close on Escape key */
  closeOnEscape?: boolean
  /** Size of the message box */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Custom icon (overrides default icon based on type) */
  icon?: React.ReactNode
  /** Custom className */
  className?: string
}

const defaultButtons: Record<MessageBoxType, MessageBoxButton[]> = {
  info: [
    {
      label: 'OK',
      variant: 'primary',
      onClick: () => {},
      autoFocus: true,
    },
  ],
  success: [
    {
      label: 'OK',
      variant: 'primary',
      onClick: () => {},
      autoFocus: true,
    },
  ],
  warning: [
    {
      label: 'OK',
      variant: 'primary',
      onClick: () => {},
      autoFocus: true,
    },
  ],
  error: [
    {
      label: 'OK',
      variant: 'primary',
      onClick: () => {},
      autoFocus: true,
    },
  ],
  confirm: [
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => {},
    },
    {
      label: 'Confirm',
      variant: 'primary',
      onClick: () => {},
      autoFocus: true,
    },
  ],
  custom: [],
}

const typeStyles: Record<MessageBoxType, { titleColor: string; iconColor: string }> = {
  info: {
    titleColor: 'var(--color-primary-500)',
    iconColor: 'var(--color-primary-500)',
  },
  success: {
    titleColor: '#10b981', // green-500
    iconColor: '#10b981',
  },
  warning: {
    titleColor: '#f59e0b', // yellow-500
    iconColor: '#f59e0b',
  },
  error: {
    titleColor: '#ef4444', // red-500
    iconColor: '#ef4444',
  },
  confirm: {
    titleColor: 'var(--color-text-primary)',
    iconColor: 'var(--color-primary-500)',
  },
  custom: {
    titleColor: 'var(--color-text-primary)',
    iconColor: 'var(--color-primary-500)',
  },
}

const defaultIcons: Record<MessageBoxType, React.ReactNode> = {
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  confirm: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  custom: null,
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function MessageBox({
  open,
  onClose,
  title,
  message,
  type = 'info',
  buttons,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  icon,
  className = '',
}: MessageBoxProps) {
  // Handle Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const typeStyle = typeStyles[type]
  const displayIcon = icon !== undefined ? icon : defaultIcons[type]
  const displayButtons = buttons || defaultButtons[type]

  // Bind onClick handlers to buttons
  const boundButtons = displayButtons.map((button) => ({
    ...button,
    onClick: () => {
      button.onClick()
      // Auto-close for non-confirm types unless explicitly prevented
      if (type !== 'confirm' || button.variant === 'primary') {
        onClose()
      }
    },
  }))

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: 'var(--color-bg-paper)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-default)' }}>
            <div className="flex items-center gap-3">
              {displayIcon && (
                <div style={{ color: typeStyle.iconColor }}>
                  {displayIcon}
                </div>
              )}
              {title && (
                <h2 className="text-2xl font-bold" style={{ color: typeStyle.titleColor }}>
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {typeof message === 'string' ? (
            <p style={{ color: 'var(--color-text-primary)' }}>{message}</p>
          ) : (
            message
          )}
        </div>

        {/* Footer */}
        {boundButtons.length > 0 && (
          <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-default)' }}>
            {boundButtons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || 'primary'}
                onClick={button.onClick}
                autoFocus={button.autoFocus}
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

