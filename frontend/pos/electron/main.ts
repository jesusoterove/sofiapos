/**
 * Electron main process.
 * Handles window creation and application lifecycle.
 * This file is compiled to CommonJS by esbuild.
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import { spawnSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { SerialPort } from 'serialport'
import { pathToFileURL } from 'url'
import { existsSync } from 'fs'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

// For production builds, use app path
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Configure auto-updater
// Disable auto-download - we'll trigger it manually after user confirmation
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Set update server URL from environment variable or use default
// Update server should serve update files and latest.yml/latest-mac.yml/latest-linux.yml
const updateServerUrl = process.env.UPDATE_SERVER_URL || process.env.VITE_UPDATE_SERVER_URL || 'https://updates.sofiapos.com'

// Configure update feed URL based on platform
// electron-updater expects a URL that serves latest.yml (Windows/Linux) or latest-mac.yml (macOS)
if (process.platform === 'win32') {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `${updateServerUrl}/win32`
  })
} else if (process.platform === 'darwin') {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `${updateServerUrl}/darwin`
  })
} else {
  // Linux
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `${updateServerUrl}/linux`
  })
}

// Log update configuration
console.log(`[AutoUpdater] Update server URL: ${updateServerUrl}`)
console.log(`[AutoUpdater] Platform: ${process.platform}`)
console.log(`[AutoUpdater] Current version: ${app.getVersion()}`)

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...')
  mainWindow?.webContents.send('update-checking')
})

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info.version)
  mainWindow?.webContents.send('update-available', {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes,
    files: info.files
  })
})

autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] No update available. Current version is latest.')
  mainWindow?.webContents.send('update-not-available', {
    version: info.version
  })
})

autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Error:', err)
  mainWindow?.webContents.send('update-error', {
    message: err.message,
    stack: err.stack
  })
})

autoUpdater.on('download-progress', (progressObj) => {
  console.log('[AutoUpdater] Download progress:', progressObj.percent)
  mainWindow?.webContents.send('update-download-progress', {
    percent: progressObj.percent,
    transferred: progressObj.transferred,
    total: progressObj.total,
    bytesPerSecond: progressObj.bytesPerSecond
  })
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] Update downloaded:', info.version)
  mainWindow?.webContents.send('update-downloaded', {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes
  })
})

function createWindow() {
  // Determine paths based on environment
  // In CommonJS (compiled output), __dirname will be available
  const appPath = app.getAppPath()
  
  let preloadPath: string
  let indexPath: string
  let iconPath: string
  
  if (isDev) {
    // Development paths - use __dirname from compiled output (dist-electron directory)
    preloadPath = path.join(__dirname, 'preload.cjs')
    indexPath = 'http://localhost:5173'
    // Icon path - try build directory, fallback to empty if not found
    const iconPathDev = path.join(__dirname, '..', 'build', 'icon.png')
    iconPath = existsSync(iconPathDev) ? iconPathDev : ''
  } else {
    // Production paths
    preloadPath = path.join(appPath, 'dist-electron', 'preload.cjs')
    indexPath = path.join(appPath, 'dist', 'index.html')
    iconPath = path.join(appPath, 'build', 'icon.png')
  }
  
  // Create the browser window
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    autoHideMenuBar: !isDev, // Show menu bar in development
    show: false, // Don't show until ready
  }
  
  // Only set icon if it exists
  if (iconPath && existsSync(iconPath)) {
    windowOptions.icon = iconPath
  }
  
  mainWindow = new BrowserWindow(windowOptions)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL(indexPath)
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // Production: load from built files with hash so TanStack Router (hash history) sees path /
    const fileUrl = pathToFileURL(indexPath).href + '#/'
    mainWindow.loadURL(fileUrl)
  }

  // Ctrl+Shift+I toggles DevTools in dev and production (no menu in prod, so this is the only way)
  mainWindow.webContents.on('before-input-event', (_, input) => {
    if (input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow?.webContents.toggleDevTools()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Check for updates on app start (only in production)
  if (!isDev) {
    // Wait a bit before checking for updates to ensure app is fully loaded
    setTimeout(() => {
      console.log('[AutoUpdater] Checking for updates on app start...')
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[AutoUpdater] Error checking for updates on start:', err)
      })
    }, 5000) // Wait 5 seconds after app ready
  }
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for Electron-specific functionality
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData')
})

// Update handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('[IPC] Checking for updates...')
    if (isDev) {
      // In development, skip update check
      console.log('[IPC] Skipping update check in development mode')
      return { success: false, error: 'Update check disabled in development mode' }
    }
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (error: any) {
    console.error('[IPC] Error checking for updates:', error)
    return { success: false, error: error.message || 'Failed to check for updates' }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    console.log('[IPC] Downloading update...')
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error: any) {
    console.error('[IPC] Error downloading update:', error)
    return { success: false, error: error.message || 'Failed to download update' }
  }
})

ipcMain.handle('install-update', async () => {
  try {
    console.log('[IPC] Installing update and restarting...')
    // quitAndInstall(force, isSilent)
    // force: true = restart immediately, false = restart on next app launch
    // isSilent: true = no user interaction, false = show installer UI
    autoUpdater.quitAndInstall(false, false)
    return { success: true }
  } catch (error: any) {
    console.error('[IPC] Error installing update:', error)
    return { success: false, error: error.message || 'Failed to install update' }
  }
})

// Serial port handlers for cash drawer
ipcMain.handle('serial-list-ports', async () => {
  try {
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      vendorId: p.vendorId,
      productId: p.productId,
      pnpId: p.pnpId,
    }))
  } catch (error: any) {
    console.error('[IPC] Error listing serial ports:', error)
    throw error
  }
})

ipcMain.handle('serial-write', async (_event, portPath: string, baudRate: number, data: Uint8Array) => {
  return new Promise<void>((resolve, reject) => {
    const port = new SerialPort({
      path: portPath,
      baudRate,
      autoOpen: false,
    })

    port.open((err) => {
      if (err) {
        port.destroy()
        reject(err)
        return
      }

      const buffer = Buffer.from(data)
      port.write(buffer, (writeErr) => {
        port.close((closeErr) => {
          port.destroy()
          if (writeErr) {
            reject(writeErr)
          } else if (closeErr) {
            reject(closeErr)
          } else {
            resolve()
          }
        })
      })
    })
  })
})

// Printer handlers for cash drawer (POS printers)
// Primary: @thesusheer/electron-printer (N-API, Electron-compatible)
// Fallback: Electron's getPrintersAsync when native module fails to load
ipcMain.handle('printer-list-printers', async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electronPrinter = require('@thesusheer/electron-printer')
    const printers = electronPrinter.getPrinters() || []
    return printers.map((p: { name?: string; displayName?: string; description?: string; status?: number }) => ({
      name: p.name || '',
      displayName: p.displayName || p.name || '',
      description: p.description || '',
      status: p.status ?? 0,
    }))
  } catch {
    // Native module failed (e.g. missing prebuild) - use Electron's built-in API
    const win = mainWindow || BrowserWindow.getAllWindows()[0]
    if (!win?.webContents) return []
    const printers = await win.webContents.getPrintersAsync()
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description || '',
      status: p.status,
    }))
  }
})

ipcMain.handle('printer-send-raw', async (_event, printerName: string, data: Uint8Array) => {
  const buffer = Buffer.from(data)

  // Path A: @thesusheer/electron-printer (N-API, Electron-compatible, prebuilds)
  let electronPrinter: { printDirect: (opts: any) => void } | null = null
  try {
    electronPrinter = require('@thesusheer/electron-printer')
  } catch {
    // Module failed to load - fallback to external script
  }

  if (electronPrinter) {
    return new Promise<void>((resolve, reject) => {
      electronPrinter!.printDirect({
        data: buffer,
        printer: printerName,
        type: 'RAW',
        docname: 'SofiaPOS',
        success: () => resolve(),
        error: (err: Error) => reject(err),
      })
    })
  }

  // Fallback: use external script (PowerShell on Windows, Node on macOS/Linux)
  // Windows: PowerShell + Win32 API (no native addons)
  // macOS/Linux: Node + printer module (requires scripts/node_modules)
  const appPath = app.getAppPath()
  const isDev = !app.isPackaged
  const scriptsDir = isDev
    ? path.join(appPath, 'scripts')
    : path.join(process.resourcesPath, 'scripts')

  const tmpFile = path.join(tmpdir(), `sofiapos-${Date.now()}-raw.bin`)
  const spawnOpts: Record<string, unknown> = {
    encoding: 'utf8',
    timeout: 10000,
  }

  try {
    writeFileSync(tmpFile, Buffer.from(data))
    let result: ReturnType<typeof spawnSync>
    if (process.platform === 'win32') {
      const psScript = path.join(scriptsDir, 'print-raw.ps1')
      result = spawnSync(
        'powershell',
        ['-ExecutionPolicy', 'Bypass', '-File', psScript, '-PrinterName', printerName, '-DataFilePath', tmpFile],
        spawnOpts
      )
    } else {
      const scriptPath = path.join(scriptsDir, 'print-raw.cjs')
      result = spawnSync('node', [scriptPath, printerName, tmpFile], { ...spawnOpts, cwd: scriptsDir })
    }
    if (result.status !== 0) {
      const errMsg = typeof result.stderr === 'string' ? result.stderr : result.stderr?.toString() || result.error?.message || 'Print failed'
      throw new Error(errMsg)
    }
  } finally {
    try {
      unlinkSync(tmpFile)
    } catch {
      // Ignore cleanup errors
    }
  }
})
