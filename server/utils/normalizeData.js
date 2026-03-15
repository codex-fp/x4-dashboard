/**
 * Normalize game data received from the X4 Lua mod.
 * Strips X4 color codes, faction color tags, and normalizes line breaks.
 * Ported from mycumycu/X4-External-App utils/textProcessor.js
 */

// X4 uses Unicode private-use chars as color code delimiters
const COLOR_CODES = /[\u0000-\u001F\u007F\uE000-\uF8FF]/g;

// Faction color tags: #RRGGBB#text# or #ffffff#text#
const FACTION_COLOR = /#[Ff][Ff][0-9a-fA-F]{4}.*?#/g;

function normalizeString(str) {
  return str
    .replace(/\r?\n/g, ' ')
    .replace(FACTION_COLOR, '')
    .replace(COLOR_CODES, '')
    .trim();
}

function normalizeData(value) {
  if (typeof value === 'string') return normalizeString(value);
  if (Array.isArray(value)) return value.map(normalizeData);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = normalizeData(value[k]);
    return out;
  }
  return value;
}

module.exports = { normalizeData };
