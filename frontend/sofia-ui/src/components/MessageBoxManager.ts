/**
 * MessageBox Manager - Provides a programmatic API for showing message boxes.
 */

export type MessageBoxButtonType = 'YesNo' | 'YesNoCancel' | 'OK' | 'OKCancel' | 'custom'

export interface MessageBoxOptions {
  title?: string
  message: string | React.ReactNode
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'custom'
  buttons?: Array<{
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    value?: any // Value to return when this button is clicked
  }>
  buttonType?: MessageBoxButtonType
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: React.ReactNode
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

export type MessageBoxResult = {
  value: any
  button: string
}

type MessageBoxResolver = (result: MessageBoxResult) => void

class MessageBoxManagerClass {
  private listeners: Set<(options: MessageBoxOptions | null, resolver: MessageBoxResolver | null) => void> = new Set()
  private currentResolver: MessageBoxResolver | null = null

  /**
   * Subscribe to message box state changes.
   */
  subscribe(listener: (options: MessageBoxOptions | null, resolver: MessageBoxResolver | null) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state change.
   */
  private notify(options: MessageBoxOptions | null, resolver: MessageBoxResolver | null) {
    this.listeners.forEach((listener) => listener(options, resolver))
  }

  /**
   * Internal show method to avoid naming conflict.
   */
  private showInternal(options: MessageBoxOptions): Promise<MessageBoxResult> {
    return new Promise((resolve) => {
      this.currentResolver = (result: MessageBoxResult) => {
        this.currentResolver = null
        this.notify(null, null)
        resolve(result)
      }
      this.notify(options, this.currentResolver)
    })
  }

  /**
   * Resolve the current message box with a result.
   */
  resolve(result: MessageBoxResult) {
    if (this.currentResolver) {
      this.currentResolver(result)
    }
  }

  /**
   * Get default buttons for a button type.
   * Made public for use in MessageBoxProvider.
   */
  getDefaultButtons(buttonType: MessageBoxButtonType): Array<{
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    value: any
  }> {
    switch (buttonType) {
      case 'YesNo':
        return [
          { label: 'No', variant: 'secondary', value: false },
          { label: 'Yes', variant: 'primary', value: true },
        ]
      case 'YesNoCancel':
        return [
          { label: 'Cancel', variant: 'secondary', value: 'cancel' },
          { label: 'No', variant: 'secondary', value: false },
          { label: 'Yes', variant: 'primary', value: true },
        ]
      case 'OK':
        return [
          { label: 'OK', variant: 'primary', value: true },
        ]
      case 'OKCancel':
        return [
          { label: 'Cancel', variant: 'secondary', value: false },
          { label: 'OK', variant: 'primary', value: true },
        ]
      default:
        return []
    }
  }

  /**
   * Show an info message box.
   */
  async info(message: string | React.ReactNode, title?: string, options?: Partial<MessageBoxOptions>): Promise<MessageBoxResult> {
    return this.showInternal({
      message,
      title: title || 'Information',
      type: 'info',
      buttonType: 'OK',
      ...options,
    })
  }

  /**
   * Show a success message box.
   */
  async success(message: string | React.ReactNode, title?: string, options?: Partial<MessageBoxOptions>): Promise<MessageBoxResult> {
    return this.showInternal({
      message,
      title: title || 'Success',
      type: 'success',
      buttonType: 'OK',
      ...options,
    })
  }

  /**
   * Show a warning message box.
   */
  async warning(message: string | React.ReactNode, title?: string, options?: Partial<MessageBoxOptions>): Promise<MessageBoxResult> {
    return this.showInternal({
      message,
      title: title || 'Warning',
      type: 'warning',
      buttonType: 'OK',
      ...options,
    })
  }

  /**
   * Show an error message box.
   */
  async error(message: string | React.ReactNode, title?: string, options?: Partial<MessageBoxOptions>): Promise<MessageBoxResult> {
    return this.showInternal({
      message,
      title: title || 'Error',
      type: 'error',
      buttonType: 'OK',
      ...options,
    })
  }

  /**
   * Show a custom message box.
   */
  async show(options: MessageBoxOptions): Promise<MessageBoxResult> {
    // If buttons are not provided, use default buttons based on buttonType
    if (!options.buttons && options.buttonType) {
      options.buttons = this.getDefaultButtons(options.buttonType)
    }
    return this.showInternal(options)
  }

  /**
   * Ask a question and return the user's selection.
   * Defaults to YesNo buttons.
   */
  async ask(
    message: string | React.ReactNode,
    title?: string,
    buttonType: MessageBoxButtonType = 'YesNo',
    options?: Partial<MessageBoxOptions>
  ): Promise<MessageBoxResult> {
    return this.showInternal({
      message,
      title: title || 'Confirm',
      type: 'confirm',
      buttonType,
      ...options,
    })
  }
}

// Export singleton instance
export const messageBox = new MessageBoxManagerClass()

