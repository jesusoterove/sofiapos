/**
 * MessageBoxProvider - Provides the MessageBox component and connects it to the manager.
 */
import React, { useState, useEffect } from 'react'
import { MessageBox, MessageBoxProps } from './MessageBox'
import { messageBox, MessageBoxOptions, MessageBoxResult } from './MessageBoxManager'

export function MessageBoxProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<MessageBoxOptions | null>(null)
  const [resolver, setResolver] = useState<((result: MessageBoxResult) => void) | null>(null)

  useEffect(() => {
    const unsubscribe = messageBox.subscribe((newOptions, newResolver) => {
      setOptions(newOptions)
      setResolver(() => newResolver)
    })

    return unsubscribe
  }, [])

  const handleClose = () => {
    if (resolver) {
      resolver({ value: false, button: 'close' })
    }
    setOptions(null)
    setResolver(null)
  }

  const handleButtonClick = (buttonValue: any, buttonLabel: string) => {
    if (resolver) {
      resolver({ value: buttonValue, button: buttonLabel })
    }
    setOptions(null)
    setResolver(null)
  }

  if (!options) {
    return <>{children}</>
  }

  // Get default buttons if not provided
  const getDefaultButtons = () => {
    if (options.buttonType && !options.buttons) {
      return messageBox.getDefaultButtons(options.buttonType)
    }
    return []
  }

  // Convert manager options to MessageBox props
  const buttonsToUse = options.buttons || getDefaultButtons()
  const buttons = buttonsToUse.map((btn: { label: string; variant?: 'primary' | 'secondary' | 'danger'; value?: any }, index: number) => ({
    label: btn.label,
    variant: btn.variant || 'primary',
    onClick: () => handleButtonClick(btn.value !== undefined ? btn.value : btn.label, btn.label),
    autoFocus: index === buttonsToUse.length - 1, // Auto-focus last button
  }))

  const messageBoxProps: MessageBoxProps = {
    open: true,
    onClose: handleClose,
    title: options.title,
    message: options.message,
    type: options.type || 'info',
    buttons: buttons.length > 0 ? buttons : undefined,
    showCloseButton: options.showCloseButton,
    closeOnBackdropClick: options.closeOnBackdropClick,
    closeOnEscape: options.closeOnEscape,
    size: options.size,
    icon: options.icon,
  }

  return (
    <>
      {children}
      <MessageBox {...messageBoxProps} />
    </>
  )
}

