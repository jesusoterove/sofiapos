# Electron Builder Configuration Guide

This document describes the Electron Builder configuration for building and publishing SofiaPOS updates.

## Overview

The Electron Builder configuration is located in `package.json` under the `build` section. It's configured to:
- Build installers for Windows (NSIS), macOS (DMG), and Linux (AppImage, DEB)
- Publish updates to a generic update server
- Generate update metadata files (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`)

## Build Scripts

### Development
```bash
npm run electron:dev
```
Runs the app in development mode with hot reload.

### Production Build
```bash
npm run electron:build
```
Builds the app for the current platform and creates installers.

### Build for Specific Platform
```bash
# Windows
npm run electron:build -- --win

# macOS
npm run electron:build -- --mac

# Linux
npm run electron:build -- --linux
```

### Build and Publish
```bash
# Set update server URL (optional, defaults to https://updates.sofiapos.com)
export UPDATE_SERVER_URL=https://your-update-server.com

# Build and publish
npm run electron:build -- --publish always
```

## Update Server Configuration

The update server URL can be configured via:
1. Environment variable: `UPDATE_SERVER_URL` or `VITE_UPDATE_SERVER_URL`
2. Default: `https://updates.sofiapos.com`

### Update Server Structure

The update server must serve files in the following structure:

```
updates.sofiapos.com/
├── win32/
│   ├── latest.yml
│   ├── SofiaPOS-1.0.1-x64.exe
│   └── SofiaPOS-1.0.1-x64.exe.blockmap
├── darwin/
│   ├── latest-mac.yml
│   ├── SofiaPOS-1.0.1-x64.dmg
│   └── SofiaPOS-1.0.1-x64.dmg.blockmap
└── linux/
    ├── latest-linux.yml
    ├── SofiaPOS-1.0.1-x64.AppImage
    └── SofiaPOS-1.0.1-x64.deb
```

### Update Metadata Files

Electron Builder automatically generates:
- **Windows/Linux**: `latest.yml` - Contains version, release date, file size, SHA512 checksum
- **macOS**: `latest-mac.yml` - Same format as `latest.yml` but for macOS

Example `latest.yml`:
```yaml
version: 1.0.1
files:
  - url: SofiaPOS-1.0.1-x64.exe
    sha512: abc123...
    size: 12345678
path: SofiaPOS-1.0.1-x64.exe
sha512: abc123...
releaseDate: '2025-01-15T10:00:00.000Z'
```

## Build Artifacts

After building, artifacts are placed in the `release/` directory:

### Windows
- `SofiaPOS-1.0.0-x64.exe` - NSIS installer
- `SofiaPOS-1.0.0-x64.exe.blockmap` - Block map for delta updates
- `latest.yml` - Update metadata

### macOS
- `SofiaPOS-1.0.0-x64.dmg` - Disk image
- `SofiaPOS-1.0.0-x64.dmg.blockmap` - Block map for delta updates
- `latest-mac.yml` - Update metadata

### Linux
- `SofiaPOS-1.0.0-x64.AppImage` - AppImage bundle
- `SofiaPOS-1.0.0-x64.deb` - Debian package
- `latest-linux.yml` - Update metadata

## Code Signing (Optional but Recommended)

### Windows
To sign Windows installers, set environment variables:
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-certificate-password
```

### macOS
To sign macOS apps, set environment variables:
```bash
export APPLE_ID=your-apple-id@example.com
export APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password
export APPLE_TEAM_ID=your-team-id
```

Or use a certificate:
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-certificate-password
```

### Linux
Linux packages don't require code signing, but you can add GPG signing:
```bash
export CSC_LINK=/path/to/private-key.pem
export CSC_KEY_PASSWORD=your-key-password
```

## Version Management

The app version is defined in `package.json`:
```json
{
  "version": "1.0.0"
}
```

When publishing a new version:
1. Update the version in `package.json`
2. Build the app: `npm run electron:build`
3. Upload artifacts to the update server
4. Ensure `latest.yml` (or `latest-mac.yml`/`latest-linux.yml`) is accessible

## Publishing Workflow

1. **Update Version**: Change version in `package.json`
2. **Build**: Run `npm run electron:build -- --win --mac --linux` (or platform-specific)
3. **Upload Artifacts**: Upload all files from `release/` to the update server
4. **Verify**: Ensure `latest.yml` files are accessible at the correct URLs
5. **Test**: Test update mechanism on a client app

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UPDATE_SERVER_URL` | Update server base URL | `https://updates.sofiapos.com` |
| `VITE_UPDATE_SERVER_URL` | Alternative update server URL | Same as above |
| `CSC_LINK` | Path to code signing certificate | None |
| `CSC_KEY_PASSWORD` | Certificate password | None |
| `APPLE_ID` | Apple ID for macOS signing | None |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | None |
| `APPLE_TEAM_ID` | Apple Team ID | None |

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Check that build icons exist (optional but recommended)
- Verify Node.js version compatibility

### Updates Not Detected
- Verify `latest.yml` files are accessible at the correct URLs
- Check that version in `package.json` is higher than current app version
- Ensure update server URL is correctly configured
- Check browser console for update check errors

### Code Signing Issues
- Verify certificate paths are correct
- Ensure certificate passwords are set correctly
- For macOS, verify Apple Developer account credentials

## Additional Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Code Signing Guide](https://www.electron.build/code-signing)

