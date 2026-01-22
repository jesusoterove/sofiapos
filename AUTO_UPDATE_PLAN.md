# Auto-Updater with WebSocket Notifications - Implementation Plan

## Overview

This plan outlines the implementation of an auto-updater system for the **SofiaPOS Electron desktop application (POS app)** that uses WebSocket connections to notify clients about available updates in real-time.

**Important Notes:**
- **POS App**: Electron desktop application - **REQUIRES** auto-updater and installer
- **Console App**: Web application - **DOES NOT** require auto-updater (updates are deployed server-side)
- **Console App Admin Interface**: Only for managing POS app updates (uploading versions, triggering notifications)

## Architecture

### Components

1. **Backend Update Service**
   - Version management API
   - Update metadata storage
   - WebSocket notification system
   - Update file hosting/CDN integration

2. **Electron Auto-Updater**
   - Update checking mechanism
   - Download and installation
   - Update UI/UX
   - Rollback capability

3. **WebSocket Integration**
   - Real-time update notifications
   - Version comparison
   - Update availability broadcast

4. **Installer Configuration**
   - Electron Builder setup
   - Code signing (optional but recommended)
   - Update server configuration

## Technology Stack

- **Electron AutoUpdater**: Built-in Electron autoUpdater module
- **electron-updater**: Enhanced auto-updater with more features (recommended)
- **WebSocket**: Existing WebSocket infrastructure for notifications
- **Backend API**: FastAPI endpoints for version management
- **File Storage**: Static file hosting or CDN for update packages

## Implementation Phases

### Phase 1: Backend Infrastructure

#### 1.1 Database Schema

**File: `backend/app/models/application_version.py`**

```python
class ApplicationVersion(Base):
    __tablename__ = "application_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False, index=True)  # e.g., "1.0.1"
    platform = Column(String(20), nullable=False)  # "win32", "darwin", "linux"
    release_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    is_mandatory = Column(Boolean, default=False)
    release_notes = Column(Text, nullable=True)
    download_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    checksum = Column(String(64), nullable=True)  # SHA-256 checksum
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_version_platform', 'version', 'platform'),
        Index('idx_active_platform', 'is_active', 'platform'),
    )
```

#### 1.2 API Endpoints

**File: `backend/app/api/v1/updates.py`**

```python
@router.get("/latest")
async def get_latest_version(
    platform: str = Query(..., description="Platform: win32, darwin, or linux"),
    current_version: Optional[str] = Query(None, description="Current app version"),
    db: Session = Depends(get_db)
):
    """Get latest available version for a platform."""
    
@router.get("/check")
async def check_for_updates(
    platform: str = Query(...),
    current_version: str = Query(...),
    db: Session = Depends(get_db)
):
    """Check if updates are available."""
    
@router.post("/notify")
async def notify_update_available(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger update notification via WebSocket."""
```

#### 1.3 WebSocket Update Notifications

**File: `backend/app/api/v1/sync.py` (extend existing)**

Add new message type: `update_available`

```python
# In websocket_sync_endpoint, add handler for update notifications
# Broadcast to all connected clients or specific cash registers
```

**File: `backend/app/services/update_notifier.py`**

```python
async def notify_update_available(
    version: ApplicationVersion,
    cash_register_ids: Optional[List[int]] = None
):
    """Notify clients about available update via WebSocket."""
```

### Phase 2: Electron Auto-Updater Setup

#### 2.1 Install Dependencies

**File: `frontend/pos/package.json`**

```json
{
  "dependencies": {
    "electron-updater": "^6.1.7"
  }
}
```

#### 2.2 Update Electron Main Process

**File: `frontend/pos/electron/main.ts`**

```typescript
import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'

// Configure auto-updater
autoUpdater.autoDownload = false // Manual download trigger
autoUpdater.autoInstallOnAppQuit = true

// Set update server URL
const updateServerUrl = process.env.UPDATE_SERVER_URL || 'https://updates.sofiapos.com'

// Platform-specific update server configuration
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
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: `${updateServerUrl}/linux`
  })
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update-checking')
})

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update-not-available', info)
})

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err.message)
})

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('update-download-progress', progressObj)
})

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info)
})

// IPC handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall(false, true)
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
```

#### 2.3 Update Preload Script

**File: `frontend/pos/electron/preload.ts`**

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods
  
  // Update methods
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // Update event listeners
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('update-checking', callback)
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_, info) => callback(info))
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
  },
  onUpdateDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
```

### Phase 3: WebSocket Integration

#### 3.1 Extend WebSocket Client

**File: `frontend/pos/src/services/websocketClient.ts`**

Add new message type:

```typescript
export interface WebSocketMessage {
  type: 'connected' | 'entity_updated' | 'pong' | 'error' | 'update_available'
  // ... existing fields
  update_info?: {
    version: string
    platform: string
    is_mandatory: boolean
    release_notes?: string
    download_url: string
    file_size?: number
  }
}
```

Add handler in `onmessage`:

```typescript
if (message.type === 'update_available') {
  console.log('[WebSocketClient] 📦 Update available notification received:', message.update_info)
  this.callbacks.onUpdateAvailable?.(message.update_info)
}
```

#### 3.2 Update SyncContext

**File: `frontend/pos/src/contexts/SyncContext.tsx`**

Add update handling:

```typescript
const handleUpdateAvailable = useCallback((updateInfo: any) => {
  // Show update notification
  // Trigger update check
  if (window.electronAPI) {
    window.electronAPI.checkForUpdates()
  }
}, [])
```

### Phase 4: Frontend Update UI

#### 4.1 Update Service

**File: `frontend/pos/src/services/updateService.ts`**

```typescript
export interface UpdateInfo {
  version: string
  isMandatory: boolean
  releaseNotes?: string
  downloadUrl: string
  fileSize?: number
}

export class UpdateService {
  static async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!window.electronAPI) return null
    
    try {
      const result = await window.electronAPI.checkForUpdates()
      return result
    } catch (error) {
      console.error('Error checking for updates:', error)
      return null
    }
  }
  
  static async downloadUpdate(): Promise<void> {
    if (!window.electronAPI) return
    
    await window.electronAPI.downloadUpdate()
  }
  
  static async installUpdate(): Promise<void> {
    if (!window.electronAPI) return
    
    await window.electronAPI.installUpdate()
  }
  
  static setupListeners(callbacks: {
    onChecking?: () => void
    onAvailable?: (info: UpdateInfo) => void
    onNotAvailable?: () => void
    onError?: (error: string) => void
    onProgress?: (progress: { percent: number }) => void
    onDownloaded?: (info: UpdateInfo) => void
  }): () => void {
    // Setup and return cleanup function
  }
}
```

#### 4.2 Update Notification Component

**File: `frontend/pos/src/components/update/UpdateNotification.tsx`**

```typescript
export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Handle update notifications
  // Show modal/dialog for update
  // Handle download and install
}
```

#### 4.3 Update Settings Page

**File: `frontend/pos/src/pages/settings/UpdateSettings.tsx`**

```typescript
export function UpdateSettings() {
  // Manual update check button
  // Update history
  // Auto-update preferences
}
```

### Phase 5: Electron Builder Configuration

#### 5.1 Update package.json

**File: `frontend/pos/package.json`**

```json
{
  "build": {
    "appId": "com.sofiapos.pos",
    "productName": "SofiaPOS",
    "publish": {
      "provider": "generic",
      "url": "https://updates.sofiapos.com"
    },
    "win": {
      "target": ["nsis"],
      "publish": ["github", "generic"]
    },
    "mac": {
      "target": ["dmg"],
      "publish": ["github", "generic"]
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "publish": ["github", "generic"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

#### 5.2 Update Server Setup

**Option A: Generic HTTP Server**

Create update server structure:

```
updates/
├── win32/
│   ├── latest.yml
│   └── SofiaPOS-Setup-1.0.1.exe
├── darwin/
│   ├── latest-mac.yml
│   └── SofiaPOS-1.0.1.dmg
└── linux/
    ├── latest-linux.yml
    └── SofiaPOS-1.0.1.AppImage
```

**Option B: GitHub Releases**

Use GitHub Releases as update server (requires GitHub token).

### Phase 6: Backend Update Management

#### 6.1 Admin Interface for Updates

**File: `backend/app/api/v1/admin/updates.py`**

```python
@router.post("/versions")
async def create_version(
    version_data: ApplicationVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new application version."""
    
@router.put("/versions/{version_id}")
async def update_version(
    version_id: int,
    version_data: ApplicationVersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update version information."""
    
@router.post("/versions/{version_id}/notify")
async def notify_version(
    version_id: int,
    notify_all: bool = Query(False),
    cash_register_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send update notification via WebSocket."""
```

#### 6.2 Console App Update Management UI (Admin Only)

**File: `frontend/console/src/pages/settings/UpdatesPage.tsx`**

**Note**: The console app is a web application and does NOT require auto-updates. This page is for administrators to manage POS app updates only.

- List all POS app versions
- Upload new POS app version files
- Set mandatory updates for POS clients
- Trigger WebSocket notifications to POS clients
- View update statistics (how many POS clients have updated)

## Update Flow

### 1. Update Release Process

1. Build new version with `npm run build:electron`
2. Upload installer files to update server
3. Create version record in database via admin API
4. (Optional) Trigger WebSocket notification to all clients

### 2. Client Update Detection

1. **On App Start**: Check for updates automatically
2. **WebSocket Notification**: Receive real-time update notification
3. **Manual Check**: User can check for updates in settings
4. **Periodic Check**: Check every 24 hours in background

### 3. Update Download & Installation

1. User is notified about available update
2. User chooses to download (or auto-download if mandatory)
3. Download progress is shown
4. After download, user can install immediately or on next restart
5. App restarts with new version

## Security Considerations

1. **Code Signing**: Sign installers for Windows and macOS
2. **Checksum Verification**: Verify downloaded files with SHA-256
3. **HTTPS Only**: All update downloads must use HTTPS
4. **Version Validation**: Backend validates version format
5. **Authentication**: Admin endpoints require authentication
6. **Rate Limiting**: Limit update check frequency

## Testing Strategy

1. **Unit Tests**: Update service functions
2. **Integration Tests**: WebSocket notification flow
3. **E2E Tests**: Full update flow (check → download → install)
4. **Manual Testing**: Test on all platforms (Windows, macOS, Linux)
5. **Rollback Testing**: Test rollback to previous version

## Migration Steps

1. **Phase 1**: Backend infrastructure (database, API, WebSocket)
2. **Phase 2**: Electron auto-updater setup
3. **Phase 3**: WebSocket integration
4. **Phase 4**: Frontend UI components
5. **Phase 5**: Electron Builder configuration
6. **Phase 6**: Admin interface
7. **Phase 7**: Testing and deployment

## Environment Variables

```bash
# Backend
UPDATE_SERVER_URL=https://updates.sofiapos.com
UPDATE_STORAGE_PATH=/var/www/updates

# Electron (build time)
UPDATE_SERVER_URL=https://updates.sofiapos.com
```

## File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── application_version.py
│   ├── api/
│   │   └── v1/
│   │       ├── updates.py
│   │       └── admin/
│   │           └── updates.py
│   └── services/
│       └── update_notifier.py

frontend/pos/
├── electron/
│   ├── main.ts (updated)
│   └── preload.ts (updated)
├── src/
│   ├── services/
│   │   └── updateService.ts
│   ├── components/
│   │   └── update/
│   │       └── UpdateNotification.tsx
│   └── pages/
│       └── settings/
│           └── UpdateSettings.tsx

frontend/console/
└── src/
    └── pages/
        └── settings/
            └── UpdatesPage.tsx  # Admin interface for managing POS app updates (not for console app itself)
```

## Dependencies

### Backend
- No new dependencies (uses existing FastAPI, SQLAlchemy, WebSocket)

### Frontend POS
- `electron-updater`: ^6.1.7

### Frontend Console
- No new dependencies (admin interface only, uses existing React/API client)

## Notes

1. **Update Server**: Can be hosted on same server or separate CDN
2. **Version Format**: Follow semantic versioning (MAJOR.MINOR.PATCH)
3. **Mandatory Updates**: Force immediate update for critical security fixes
4. **Rollback**: Keep previous version available for rollback
5. **Bandwidth**: Consider delta updates for large files
6. **Offline Mode**: Handle gracefully when update server is unreachable

## Future Enhancements

1. **Delta Updates**: Only download changed files
2. **Staged Rollouts**: Release to percentage of users first
3. **Update Analytics**: Track update success/failure rates
4. **Auto-Update Scheduling**: Schedule updates during off-hours
5. **Multi-Channel Updates**: Beta, stable, and LTS channels

