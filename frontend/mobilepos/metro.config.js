const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Ensure hoisted packages (nativewind, react-native-css-interop) can resolve
// react-native from the project's own node_modules, not just the workspace root.
const Module = require('module');
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (
    request === 'react-native/package.json' ||
    request === 'react-native'
  ) {
    const fromProject = path.join(projectRoot, 'node_modules', request);
    try {
      return origResolveFilename.call(this, fromProject, parent, isMain, options);
    } catch {}
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};

const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(new Set([workspaceRoot, ...config.watchFolders]));
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    path.join(projectRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
    ...config.resolver.nodeModulesPaths,
  ])
);
const sharedRoot = path.resolve(workspaceRoot, 'sofia-shared');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@sofiapos/shared': sharedRoot,
};

// Apply nativewind first, then layer our custom resolver on top so it
// doesn't get overwritten by withNativeWind.
const nwConfig = withNativeWind(config, { input: './global.css' });

// Resolve @sofiapos/shared subpath imports (e.g. /theme, /utils) directly
// from TypeScript source so we don't need a pre-built dist/.
const nwResolveRequest = nwConfig.resolver.resolveRequest;
nwConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@sofiapos/shared' || moduleName.startsWith('@sofiapos/shared/')) {
    const subpath = moduleName.replace('@sofiapos/shared', '');
    const filePath = subpath
      ? path.join(sharedRoot, 'src', subpath, 'index.ts')
      : path.join(sharedRoot, 'src', 'index.ts');
    return { type: 'sourceFile', filePath };
  }
  if (nwResolveRequest) {
    return nwResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nwConfig;
