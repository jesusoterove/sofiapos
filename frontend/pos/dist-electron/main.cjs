// This file is CommonJS

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var import_fs = require("fs");
var mainWindow = null;
var isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
function createWindow() {
  const appPath = import_electron.app.getAppPath();
  let preloadPath;
  let indexPath;
  let iconPath;
  if (isDev) {
    preloadPath = path.join(__dirname, "preload.cjs");
    indexPath = "http://localhost:5173";
    const iconPathDev = path.join(__dirname, "..", "build", "icon.png");
    iconPath = (0, import_fs.existsSync)(iconPathDev) ? iconPathDev : "";
  } else {
    preloadPath = path.join(appPath, "dist-electron", "preload.cjs");
    indexPath = path.join(appPath, "dist", "index.html");
    iconPath = path.join(appPath, "build", "icon.png");
  }
  const windowOptions = {
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: "default",
    autoHideMenuBar: !isDev,
    // Show menu bar in development
    show: false
    // Don't show until ready
  };
  if (iconPath && (0, import_fs.existsSync)(iconPath)) {
    windowOptions.icon = iconPath;
  }
  mainWindow = new import_electron.BrowserWindow(windowOptions);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  if (isDev) {
    mainWindow.loadURL(indexPath);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import_electron.shell.openExternal(url);
    return { action: "deny" };
  });
}
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.ipcMain.handle("get-app-version", () => {
  return import_electron.app.getVersion();
});
import_electron.ipcMain.handle("get-app-path", () => {
  return import_electron.app.getPath("userData");
});
import_electron.ipcMain.handle("check-for-updates", async () => {
  return { available: false };
});
//# sourceMappingURL=main.cjs.map
