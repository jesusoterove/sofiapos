const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Register the project's node_modules as a global search path so that
// hoisted packages (nativewind at workspace root) can resolve react-native
// which stays local to this project due to npm workspace hoisting rules.
const projectModules = path.join(projectRoot, 'node_modules');
process.env.NODE_PATH = [projectModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
require('module')._initPaths();

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(projectRoot);
const sharedRoot = path.resolve(workspaceRoot, 'sofia-shared');

config.watchFolders = Array.from(new Set([workspaceRoot, ...config.watchFolders]));
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    projectModules,
    path.join(workspaceRoot, 'node_modules'),
    ...config.resolver.nodeModulesPaths,
  ])
);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@sofiapos/shared': sharedRoot,
};

// Apply nativewind first, then layer our shared resolver on top.
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
