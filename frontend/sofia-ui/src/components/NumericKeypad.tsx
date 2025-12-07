/**
 * Numeric keypad component for touch-friendly number input.
 */
import React, { useState } from 'react'
import { FaBackspace } from 'react-icons/fa'

export interface NumericKeypadProps {
  value: string
  onChange: (value: string) => void
  onEnter?: () => void
  maxDecimals?: number
  className?: string
}

export function NumericKeypad({
  value,
  onChange,
  onEnter,
  maxDecimals = 2,
  className = '',
}: NumericKeypadProps) {
  const handleNumberClick = (num: string) => {
    const newValue = value + num
    
    // Check decimal places
    if (newValue.includes('.')) {
      const parts = newValue.split('.')
      if (parts[1] && parts[1].length > maxDecimals) {
        return
      }
    }
    
    onChange(newValue)
  }

  const handleDecimalClick = () => {
    if (!value.includes('.')) {
      onChange(value ? value + '.' : '0.')
    }
  }

  const handleBackspace = () => {
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    onChange('')
  }

  const buttons = [
    { label: '7', value: '7', onClick: () => handleNumberClick('7') },
    { label: '8', value: '8', onClick: () => handleNumberClick('8') },
    { label: '9', value: '9', onClick: () => handleNumberClick('9') },
    { label: '4', value: '4', onClick: () => handleNumberClick('4') },
    { label: '5', value: '5', onClick: () => handleNumberClick('5') },
    { label: '6', value: '6', onClick: () => handleNumberClick('6') },
    { label: '1', value: '1', onClick: () => handleNumberClick('1') },
    { label: '2', value: '2', onClick: () => handleNumberClick('2') },
    { label: '3', value: '3', onClick: () => handleNumberClick('3') },
    { label: '.', value: '.', onClick: handleDecimalClick },
    { label: '0', value: '0', onClick: () => handleNumberClick('0') },
    { label: <FaBackspace />, value: 'backspace', onClick: handleBackspace },
  ]

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {buttons.map((button) => (
        <button
          key={button.value}
          onClick={button.onClick}
          className="h-14 text-lg font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
          style={{
            borderColor: 'var(--color-border-default, #E5E7EB)',
            backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
            color: 'var(--color-text-primary, #111827)',
          }}
        >
          {button.label}
        </button>
      ))}
      <button
        onClick={handleClear}
        className="col-span-3 h-12 text-base font-medium rounded-lg border transition-colors hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
        style={{
          borderColor: 'var(--color-border-default, #E5E7EB)',
          backgroundColor: 'var(--color-bg-paper, #FFFFFF)',
          color: 'var(--color-text-primary, #111827)',
        }}
      >
        Clear
      </button>
    </div>
  )
}

