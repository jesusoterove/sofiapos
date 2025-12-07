/**
 * Tooltip component for displaying hover information.
 */
import { ReactNode } from 'react'

export interface TooltipProps {
  children: ReactNode
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ children, text, position = 'top', className = '' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className={`relative inline-block group ${className}`}>
      {children}
      <div
        className={`
          absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
          whitespace-nowrap
          ${positionClasses[position]}
        `}
        role="tooltip"
      >
        {text}
        {/* Tooltip arrow */}
        <div
          className={`
            absolute w-0 h-0 border-4 border-transparent
            ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900'
                : 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
            }
          `}
        />
      </div>
    </div>
  )
}

