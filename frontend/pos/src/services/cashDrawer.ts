/**
 * Cash drawer service for opening cash drawer via serial port or POS printer.
 */
import { openDatabase } from '../db'
import { printSampleReceipt } from './receiptPrint'
import { toast } from 'react-toastify'
import i18n from '../i18n'

export type CashDrawerConnectionType = 'printer' | 'serial'

export interface CashDrawerConfig {
  id?: number
  device_name: string
  connection_type: CashDrawerConnectionType
  port_path?: string
  printer_name?: string
  baud_rate: number
  is_active: boolean
  /** When true, the "Print receipt" toggle in the payment confirmation dialog defaults to checked. Default: false. */
  print_receipt_enabled?: boolean
  created_at?: string
  updated_at?: string
}

/** Config for receipt printing: whether printer is available, printer name, and default toggle state. */
export interface PrintReceiptConfig {
  enabled: boolean
  printerName: string | null
  /** Default checked state for Print Receipt toggle (from print_receipt_enabled setting). */
  defaultChecked: boolean
}

function migrateConfig(config: Record<string, unknown>): CashDrawerConfig {
  // Migrate legacy configs: port_path without connection_type -> serial
  const connectionType: CashDrawerConnectionType =
    (config.connection_type as CashDrawerConnectionType) ??
    (config.port_path ? 'serial' : 'printer')
  return { ...config, connection_type: connectionType } as CashDrawerConfig
}

/**
 * Get active cash drawer configuration from IndexedDB.
 */
export async function getCashDrawerConfig(): Promise<CashDrawerConfig | null> {
  const db = await openDatabase()
  
  // Get all configs and filter in memory since IndexedDB boolean indexes may not work reliably with getAll
  const allConfigs = await db.getAll('cash_drawer_config')
  const activeConfigs = allConfigs.filter((config) => config.is_active === true)
  
  if (activeConfigs.length === 0) return null
  return migrateConfig(activeConfigs[0] as Record<string, unknown>)
}

/**
 * Get print receipt configuration from active cash drawer config.
 * Toggle is shown when connection_type is 'printer' and printer_name is set.
 * print_receipt_enabled controls the default checked state.
 */
export async function getPrintReceiptConfig(): Promise<PrintReceiptConfig> {
  const config = await getCashDrawerConfig()
  if (!config || config.connection_type !== 'printer' || !config.printer_name?.trim()) {
    return { enabled: false, printerName: null, defaultChecked: false }
  }
  return {
    enabled: true,
    printerName: config.printer_name.trim(),
    defaultChecked: config.print_receipt_enabled ?? false,
  }
}

/**
 * Save or update cash drawer configuration.
 */
export async function saveCashDrawerConfig(config: CashDrawerConfig): Promise<void> {
  const db = await openDatabase()
  const now = new Date().toISOString()
  
  if (config.id) {
    // Update existing
    const existing = await db.get('cash_drawer_config', config.id)
    if (existing) {
      await db.put('cash_drawer_config', {
        ...existing,
        ...config,
        updated_at: now,
      })
    }
  } else {
    // Create new - exclude id as it will be auto-generated
    const { id, ...configWithoutId } = config
    await db.add('cash_drawer_config', {
      ...configWithoutId,
      created_at: now,
      updated_at: now,
    } as any) // Type assertion needed because id is required in the type but will be auto-generated
  }
}

/**
 * List available serial ports (via Electron IPC).
 * This requires Electron's serial port API.
 */
export async function listSerialPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
  // Check if we're in Electron environment (uses electronAPI, not electron)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.serial) {
    try {
      return await (window as any).electronAPI.serial.listPorts()
    } catch (error) {
      console.error('Failed to list serial ports:', error)
      throw error
    }
  }
  // Fallback for web environment (return empty array)
  return []
}

/**
 * List available printers (via Electron IPC).
 * This uses Electron's built-in getPrintersAsync.
 */
export async function listPrinters(): Promise<
  Array<{ name: string; displayName: string; description: string; status: number }>
> {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.printers) {
    try {
      return await (window as any).electronAPI.printers.list()
    } catch (error) {
      console.error('Failed to list printers:', error)
      throw error
    }
  }
  return []
}

/**
 * Print test: open cash drawer and, for printer connection, print a sample receipt.
 * Used by the "Print test" button in settings.
 */
export async function testPrint(config: CashDrawerConfig): Promise<boolean> {
  const opened = await sendOpenCashDrawerCommand(config)
  if (!opened) return false

  if (config.connection_type === 'printer' && config.printer_name?.trim()) {
    try {
      await printSampleReceipt(config.printer_name.trim())
    } catch (error) {
      console.error('Sample receipt print failed:', error)
      toast.error(i18n.t('settings.cashDrawer.printTestFailed') || 'Cash drawer opened but sample receipt failed to print.')
    }
  }
  return true
}

/** @deprecated Use testPrint instead. */
export async function testOpenCashDrawer(config: CashDrawerConfig): Promise<boolean> {
  return testPrint(config)
}

/**
 * Open cash drawer by sending ESC/POS command.
 * Standard command: ESC p 0 10 10
 * Supports both printer (RAW) and serial port modes.
 */
export async function openCashDrawer(): Promise<boolean> {
  try {
    const config = await getCashDrawerConfig()
    
    if (!config) {
      toast.error(i18n.t('settings.cashDrawer.notConfigured') || 'Cash drawer not configured. Please configure it in settings.')
      return false
    }

    return sendOpenCashDrawerCommand(config)
  } catch (error) {
    console.error('Error opening cash drawer:', error)
    toast.error(i18n.t('settings.cashDrawer.openError') || 'Error opening cash drawer')
    return false
  }
}

async function sendOpenCashDrawerCommand(config: CashDrawerConfig): Promise<boolean> {
  // Check if we're in Electron environment
  if (typeof window === 'undefined' || !(window as any).electronAPI) {
    toast.error(i18n.t('settings.cashDrawer.requiresElectron') || 'Cash drawer functionality requires Electron environment.')
    return false
  }

  const connectionType = config.connection_type ?? (config.port_path ? 'serial' : 'printer')

  if (connectionType === 'printer' && !config.printer_name?.trim()) {
    toast.error(i18n.t('settings.cashDrawer.printerRequired') || 'Please select a printer.')
    return false
  }
  if (connectionType === 'serial' && !config.port_path?.trim()) {
    toast.error(i18n.t('settings.portPathRequired') || 'Port path is required')
    return false
  }

  const command = new Uint8Array([0x1B, 0x70, 0x00, 0x0A, 0x0A])
  const altCommand = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA])

  const sendViaPrinter = async (cmd: Uint8Array) => {
    if (!(window as any).electronAPI?.printers || !config.printer_name) {
      throw new Error('Printer not configured')
    }
    await (window as any).electronAPI.printers.sendRaw(config.printer_name!, cmd)
  }

  const sendViaSerial = async (cmd: Uint8Array) => {
    if (!(window as any).electronAPI?.serial || !config.port_path) {
      throw new Error('Serial port not configured')
    }
    await (window as any).electronAPI.serial.write(config.port_path, config.baud_rate, cmd)
  }

  const sendCommand = connectionType === 'printer' ? sendViaPrinter : sendViaSerial

  try {
    await sendCommand(command)
    return true
  } catch (error) {
    console.error('Failed to open cash drawer:', error)
    if (connectionType === 'serial') {
      try {
        await sendCommand(altCommand)
        return true
      } catch (altError) {
        console.error('Failed to open cash drawer with alternative command:', altError)
      }
    }
    toast.error(i18n.t('settings.cashDrawer.openFailed') || 'Failed to open cash drawer. Please check the connection.')
    return false
  }
}

