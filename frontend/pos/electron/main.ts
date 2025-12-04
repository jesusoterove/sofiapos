/**
 * Electron main process.
 * Handles window creation and application lifecycle.
 * This file is compiled to CommonJS by esbuild.
 */
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import { existsSync } from 'fs'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

// For production builds, use app path
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

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
      enableRemoteModule: false,
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
    // Production: load from built files
    mainWindow.loadFile(indexPath)
  }

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

// Handle app updates (if implementing auto-update)
ipcMain.handle('check-for-updates', async () => {
  // Implement update checking logic here
  return { available: false }
})
