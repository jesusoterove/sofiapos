# SofiaPOS - Point of Sale Application

Electron-based Point of Sale application for restaurants and food businesses.

## Features

- **Offline-first**: Works without internet connection
- **Cross-platform**: Windows, macOS, and Linux support
- **Touch-optimized**: Designed for touch screens
- **Multi-language**: English and Spanish support
- **Data sync**: Syncs with administration system when online

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development (Electron + Vite dev server)
npm run electron:dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron app when server is ready
3. Hot reload on code changes

### Build

```bash
# Build for production
npm run build:electron

# This will:
# 1. Build React app
# 2. Compile Electron main process
# 3. Package application for current platform
```

### Build for Specific Platform

```bash
# Windows
npm run build:electron -- --win

# macOS
npm run build:electron -- --mac

# Linux
npm run build:electron -- --linux
```

## Project Structure

```
pos/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry
│   └── preload.ts     # Preload script
├── src/               # React application
│   ├── app/           # App configuration
│   ├── components/    # React components
│   ├── features/      # Feature modules
│   ├── db/            # IndexedDB (offline storage)
│   └── ...
├── dist/              # Built React app
├── dist-electron/      # Built Electron main process
└── release/           # Packaged applications
```

## Electron Features

- **Window Management**: Custom window controls
- **Auto-update**: Ready for update implementation
- **File System Access**: For local data storage
- **Native Menus**: Platform-specific menus
- **System Integration**: Tray icons, notifications, etc.

## Offline Storage

The app uses IndexedDB for offline storage:
- Products, Orders, Customers
- Inventory entries
- Sync queue

Data syncs automatically when connection is restored.

## Configuration

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000
```

### Electron Configuration

Edit `electron-builder.yml` or `package.json` build section to customize:
- App ID
- Icons
- Installer options
- Platform-specific settings

## Packaging

The app is packaged using `electron-builder`:

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG disk image
- **Linux**: AppImage and DEB package

## Distribution

Built applications are in the `release/` directory:
- Windows: `SofiaPOS Setup X.X.X.exe`
- macOS: `SofiaPOS-X.X.X.dmg`
- Linux: `SofiaPOS-X.X.X.AppImage`

## Troubleshooting

### Electron window doesn't open
- Check if Vite dev server is running
- Check console for errors
- Verify Electron is installed: `npm list electron`

### Build fails
- Ensure all dependencies are installed
- Check Node.js version (18+)
- Clear `dist` and `dist-electron` folders and rebuild

### App doesn't work offline
- Check IndexedDB setup
- Verify service worker (if using)
- Check sync queue implementation

