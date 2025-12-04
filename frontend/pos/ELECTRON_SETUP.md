# Electron Setup Guide

## Overview

The POS application is built as an Electron desktop application for Windows, macOS, and Linux.

## Architecture

- **Main Process** (`electron/main.ts`): Manages application lifecycle and windows
- **Renderer Process** (`src/`): React application running in Electron window
- **Preload Script** (`electron/preload.ts`): Secure bridge between main and renderer

## Development

### Start Development

```bash
npm run electron:dev
```

This command:
1. Starts Vite dev server (http://localhost:5173)
2. Waits for server to be ready
3. Launches Electron window
4. Enables hot reload

### Build for Production

```bash
# Build React app and Electron main process
npm run build:electron
```

This creates installers in `release/` directory:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage` and `.deb` packages

## Project Structure

```
pos/
├── electron/
│   ├── main.ts          # Main process (window management)
│   └── preload.ts       # Preload script (IPC bridge)
├── src/                 # React application
├── dist/                # Built React app
├── dist-electron/       # Built Electron main/preload
├── release/             # Packaged applications
└── build.js             # Build script for Electron
```

## Configuration

### Window Settings

Edit `electron/main.ts` to customize:
- Window size and minimum size
- Window title and icon
- Menu bar visibility
- DevTools in development

### Packaging

Edit `package.json` `build` section or `electron-builder.yml`:
- App ID and name
- Icons for each platform
- Installer options
- Code signing (for distribution)

## Platform-Specific Notes

### Windows
- Uses NSIS installer
- Icon: `build/icon.ico`
- Creates Start Menu shortcut

### macOS
- Uses DMG disk image
- Icon: `build/icon.icns`
- Requires code signing for distribution
- Category: Business

### Linux
- Creates AppImage and DEB packages
- Icon: `build/icon.png`
- Category: Office

## Offline Storage

Electron provides access to:
- **User Data Directory**: `app.getPath('userData')`
- **IndexedDB**: Works same as browser
- **File System**: Can use Node.js fs module if needed

## IPC Communication

Use preload script for secure IPC:

```typescript
// In renderer (React)
const version = await window.electronAPI.getAppVersion()

// In main process
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
```

## Auto-Updates

The app is ready for auto-updates. Implement in:
- `electron/main.ts`: Check for updates on startup
- Use `electron-updater` package for implementation

## Troubleshooting

### Window doesn't open
- Check Vite dev server is running
- Check console for errors
- Verify Electron is installed: `npm list electron`

### Build fails
- Ensure all dependencies installed
- Check Node.js version (18+)
- Clear `dist` and `dist-electron` folders

### Preload script errors
- Check `dist-electron/preload.js` exists
- Verify path in main.ts is correct
- Check contextIsolation is true

## Distribution

### Windows
1. Build: `npm run build:electron -- --win`
2. Installer: `release/SofiaPOS Setup X.X.X.exe`

### macOS
1. Build: `npm run build:electron -- --mac`
2. DMG: `release/SofiaPOS-X.X.X.dmg`

### Linux
1. Build: `npm run build:electron -- --linux`
2. AppImage: `release/SofiaPOS-X.X.X.AppImage`
3. DEB: `release/SofiaPOS_X.X.X_amd64.deb`

