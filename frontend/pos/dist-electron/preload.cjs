// This file is CommonJS

"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getAppVersion: () => import_electron.ipcRenderer.invoke("get-app-version"),
  getAppPath: () => import_electron.ipcRenderer.invoke("get-app-path"),
  // Updates
  checkForUpdates: () => import_electron.ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => import_electron.ipcRenderer.invoke("download-update"),
  installUpdate: () => import_electron.ipcRenderer.invoke("install-update"),
  // Update event listeners
  onUpdateChecking: (callback) => {
    import_electron.ipcRenderer.on("update-checking", callback);
  },
  onUpdateAvailable: (callback) => {
    import_electron.ipcRenderer.on("update-available", (_, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    import_electron.ipcRenderer.on("update-not-available", (_, info) => callback(info));
  },
  onUpdateError: (callback) => {
    import_electron.ipcRenderer.on("update-error", (_, error) => callback(error));
  },
  onUpdateDownloadProgress: (callback) => {
    import_electron.ipcRenderer.on("update-download-progress", (_, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    import_electron.ipcRenderer.on("update-downloaded", (_, info) => callback(info));
  },
  // Remove listeners
  removeAllListeners: (channel) => {
    import_electron.ipcRenderer.removeAllListeners(channel);
  },
  // Platform info
  platform: process.platform,
  // Serial port (cash drawer)
  serial: {
    listPorts: () => import_electron.ipcRenderer.invoke("serial-list-ports"),
    write: (portPath, baudRate, data) => import_electron.ipcRenderer.invoke("serial-write", portPath, baudRate, data)
  },
  // Printers (cash drawer via POS printer)
  printers: {
    list: () => import_electron.ipcRenderer.invoke("printer-list-printers"),
    sendRaw: (printerName, data) => import_electron.ipcRenderer.invoke("printer-send-raw", printerName, data)
  },
  // Window controls (if needed)
  minimize: () => import_electron.ipcRenderer.send("window-minimize"),
  maximize: () => import_electron.ipcRenderer.send("window-maximize"),
  close: () => import_electron.ipcRenderer.send("window-close")
});
//# sourceMappingURL=preload.cjs.map
