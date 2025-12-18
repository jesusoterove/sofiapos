/**
 * Cash drawer service for opening cash drawer via serial port.
 */
import { openDatabase } from '../db'
import { toast } from 'react-toastify'
import { useTranslation } from '../i18n/hooks'

export interface CashDrawerConfig {
  id?: number
  device_name: string
  port_path: string
  baud_rate: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Get active cash drawer configuration from IndexedDB.
 */
export async function getCashDrawerConfig(): Promise<CashDrawerConfig | null> {
  const db = await openDatabase()
  const index = db.transaction('cash_drawer_config', 'readonly').store.index('by-active')
  const configs = await index.getAll(true) // Get all active configs
  return configs.length > 0 ? configs[0] : null
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
    // Create new
    await db.add('cash_drawer_config', {
      ...config,
      created_at: now,
      updated_at: now,
    })
  }
}

/**
 * List available serial ports (via Electron IPC).
 * This requires Electron's serial port API.
 */
export async function listSerialPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
  // Check if we're in Electron environment
  if (typeof window !== 'undefined' && (window as any).electron?.serial) {
    try {
      return await (window as any).electron.serial.listPorts()
    } catch (error) {
      console.error('Failed to list serial ports:', error)
      return []
    }
  }
  // Fallback for web environment (return empty array)
  return []
}

/**
 * Open cash drawer by sending ESC/POS command.
 * Standard command: ESC p 0 10 10
 */
export async function openCashDrawer(): Promise<boolean> {
  try {
    const config = await getCashDrawerConfig()
    
    if (!config) {
      toast.error('Cash drawer not configured. Please configure it in settings.')
      return false
    }

    // Check if we're in Electron environment
    if (typeof window === 'undefined' || !(window as any).electron?.serial) {
      toast.error('Cash drawer functionality requires Electron environment.')
      return false
    }

    // ESC/POS command: ESC p 0 10 10
    // ESC = 0x1B, p = 0x70, 0 = 0x00, 10 = 0x0A, 10 = 0x0A
    const command = new Uint8Array([0x1B, 0x70, 0x00, 0x0A, 0x0A])
    
    try {
      await (window as any).electron.serial.write(config.port_path, config.baud_rate, command)
      toast.success('Cash drawer opened successfully')
      return true
    } catch (error) {
      console.error('Failed to open cash drawer:', error)
      // Try alternative command: ESC p 0 25 250
      try {
        const altCommand = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA])
        await (window as any).electron.serial.write(config.port_path, config.baud_rate, altCommand)
        toast.success('Cash drawer opened successfully')
        return true
      } catch (altError) {
        console.error('Failed to open cash drawer with alternative command:', altError)
        toast.error('Failed to open cash drawer. Please check the connection.')
        return false
      }
    }
  } catch (error) {
    console.error('Error opening cash drawer:', error)
    toast.error('Error opening cash drawer')
    return false
  }
}

