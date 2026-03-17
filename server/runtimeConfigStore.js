const fs = require('fs');
const path = require('path');

const RUNTIME_CONFIG_PATH = path.join(__dirname, 'config', 'runtime.json');

function getDefaultRuntimeConfig() {
  return {
    allowRemoteControls: process.env.ALLOW_REMOTE_CONTROLS === 'true',
    autoHotkeyPath: process.env.AUTOHOTKEY_PATH || '',
    forceActivateGameWindow: process.env.X4_FORCE_ACTIVATE === 'true',
    gameWindowTitle: process.env.X4_WINDOW_TITLE || 'X4',
  };
}

function sanitizeRuntimeConfig(value) {
  const defaults = getDefaultRuntimeConfig();
  const input = value || {};

  return {
    allowRemoteControls: typeof input.allowRemoteControls === 'boolean'
      ? input.allowRemoteControls
      : defaults.allowRemoteControls,
    autoHotkeyPath: typeof input.autoHotkeyPath === 'string'
      ? input.autoHotkeyPath.trim()
      : defaults.autoHotkeyPath,
    forceActivateGameWindow: typeof input.forceActivateGameWindow === 'boolean'
      ? input.forceActivateGameWindow
      : defaults.forceActivateGameWindow,
    gameWindowTitle: typeof input.gameWindowTitle === 'string' && input.gameWindowTitle.trim()
      ? input.gameWindowTitle.trim()
      : defaults.gameWindowTitle,
  };
}

function readRuntimeConfig() {
  if (!fs.existsSync(RUNTIME_CONFIG_PATH)) {
    return getDefaultRuntimeConfig();
  }

  return sanitizeRuntimeConfig(JSON.parse(fs.readFileSync(RUNTIME_CONFIG_PATH, 'utf8')));
}

function writeRuntimeConfig(value) {
  const next = sanitizeRuntimeConfig(value);
  fs.writeFileSync(RUNTIME_CONFIG_PATH, JSON.stringify(next, null, 2));
  return next;
}

function mergeRuntimeConfigUpdates(current, updates) {
  return sanitizeRuntimeConfig({
    ...current,
    ...updates,
  });
}

module.exports = {
  RUNTIME_CONFIG_PATH,
  readRuntimeConfig,
  writeRuntimeConfig,
  mergeRuntimeConfigUpdates,
};
