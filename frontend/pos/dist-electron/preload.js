"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getAppVersion: () => import_electron.ipcRenderer.invoke("get-app-version"),
  getAppPath: () => import_electron.ipcRenderer.invoke("get-app-path"),
  // Updates
  checkForUpdates: () => import_electron.ipcRenderer.invoke("check-for-updates"),
  // Platform info
  platform: process.platform,
  // Window controls (if needed)
  minimize: () => import_electron.ipcRenderer.send("window-minimize"),
  maximize: () => import_electron.ipcRenderer.send("window-maximize"),
  close: () => import_electron.ipcRenderer.send("window-close")
});
//# sourceMappingURL=preload.js.map
