const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(new Set([workspaceRoot, ...config.watchFolders]));
config.resolver.nodeModulesPaths = Array.from(
  new Set([path.join(workspaceRoot, 'node_modules'), ...config.resolver.nodeModulesPaths])
);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@sofiapos/shared': path.resolve(workspaceRoot, 'sofia-shared'),
};

module.exports = withNativeWind(config, { input: './global.css' });
