const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const projectModules = path.join(projectRoot, 'node_modules');

// Ensure hoisted workspace packages can resolve react-native from this
// project's node_modules (npm workspace hoisting may separate them).
process.env.NODE_PATH = [projectModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
require('module')._initPaths();

const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(projectRoot);

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
  '@sofiapos/shared': path.resolve(workspaceRoot, 'sofia-shared'),
};

module.exports = withNativeWind(config, { input: './global.css' });
