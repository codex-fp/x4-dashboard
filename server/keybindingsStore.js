const fs = require('fs');
const path = require('path');

const KEYBINDINGS_PATH = path.join(__dirname, 'config', 'keybindings.json');

function readKeybindings() {
  return JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8'));
}

function writeKeybindings(data) {
  fs.writeFileSync(KEYBINDINGS_PATH, JSON.stringify(data, null, 2));
  return data;
}

function mergeKeybindingUpdates(current, updates) {
  const nextBindings = { ...current.bindings };

  for (const [action, update] of Object.entries(updates || {})) {
    if (!nextBindings[action]) {
      continue;
    }

    const nextKey = typeof update?.key === 'string' ? update.key.trim() : nextBindings[action].key;

    nextBindings[action] = {
      ...nextBindings[action],
      key: nextKey,
    };
  }

  return {
    ...current,
    bindings: nextBindings,
  };
}

module.exports = {
  KEYBINDINGS_PATH,
  readKeybindings,
  writeKeybindings,
  mergeKeybindingUpdates,
};
