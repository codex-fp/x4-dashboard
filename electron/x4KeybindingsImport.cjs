const fs = require('fs')
const os = require('os')
const path = require('path')

const SUPPORTED_ACTION_IMPORTS = {
  flightAssist: 'INPUT_ACTION_TOGGLE_FLIGHT_ASSIST',
  seta: 'INPUT_ACTION_TOGGLE_SETA_MODE',
  autopilot: 'INPUT_ACTION_TOGGLE_AUTOPILOT',
  travelDrive: 'INPUT_ACTION_TOGGLE_TRAVEL_MODE',
  scanMode: 'INPUT_ACTION_TOGGLE_SCAN_MODE',
  longRangeScan: 'INPUT_ACTION_TOGGLE_LONGRANGE_SCAN_MODE',
  openMap: 'INPUT_ACTION_OPEN_MAP',
  openMissionManager: 'INPUT_ACTION_OPEN_MISSIONS',
}

const ACTION_IDS = Object.values(SUPPORTED_ACTION_IMPORTS)
const KEYCODE_PREFIX = 'INPUT_KEYCODE_'
const INPUTMAP_FILE_PATTERN = /^inputmap(?:_\d+)?\.xml$/i
const SUPPORTED_MODIFIERS = {
  CONTROL: '^',
  SHIFT: '+',
  MENU: '%',
}

function getSearchRoots() {
  const userProfile = process.env.USERPROFILE || os.homedir()

  return Array.from(new Set([
    path.join(userProfile, 'Documents', 'Egosoft', 'X4'),
    path.join(userProfile, 'OneDrive', 'Documents', 'Egosoft', 'X4'),
    path.join(userProfile, 'Saved Games', 'Egosoft', 'X4'),
  ]))
}

function findInputmapCandidates() {
  const candidates = []

  for (const root of getSearchRoots()) {
    if (!fs.existsSync(root)) {
      continue
    }

    let profiles = []

    try {
      profiles = fs.readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }

    for (const profile of profiles) {
      if (!profile.isDirectory()) {
        continue
      }

      const profilePath = path.join(root, profile.name)
      let files = []

      try {
        files = fs.readdirSync(profilePath, { withFileTypes: true })
      } catch {
        continue
      }

      for (const file of files) {
        if (!file.isFile() || !INPUTMAP_FILE_PATTERN.test(file.name)) {
          continue
        }

        const filePath = path.join(profilePath, file.name)

        try {
          const stats = fs.statSync(filePath)
          candidates.push({
            filePath,
            profilePath,
            root,
            modifiedAt: stats.mtimeMs,
          })
        } catch {}
      }
    }
  }

  return candidates.sort((left, right) => right.modifiedAt - left.modifiedAt)
}

function parseAttributes(fragment) {
  const attributes = {}

  for (const match of fragment.matchAll(/(\w+)="([^"]*)"/g)) {
    attributes[match[1]] = match[2]
  }

  return attributes
}

function extractKeyboardBindings(xml) {
  const bindingsByActionId = {}

  for (const actionMatch of xml.matchAll(/<action\b([^>]*?)\/>/g)) {
    const attributes = parseAttributes(actionMatch[1] || '')

    if (attributes.source !== 'INPUT_SOURCE_KEYBOARD' || !ACTION_IDS.includes(attributes.id)) {
      continue
    }

    if (!bindingsByActionId[attributes.id]) {
      bindingsByActionId[attributes.id] = []
    }

    bindingsByActionId[attributes.id].push({
      code: attributes.code || '',
      source: attributes.source,
    })
  }

  return bindingsByActionId
}

function convertX4CodeToSendKeys(code) {
  if (!code || !code.startsWith(KEYCODE_PREFIX)) {
    return { ok: false, reason: 'Unsupported keyboard binding format.' }
  }

  const tokens = code.slice(KEYCODE_PREFIX.length).split('_').filter(Boolean)
  const modifiers = []

  while (tokens.length > 1 && SUPPORTED_MODIFIERS[tokens[tokens.length - 1]]) {
    modifiers.unshift(tokens.pop())
  }

  const baseToken = tokens.join('_')
  const baseKey = mapBaseTokenToSendKeys(baseToken)

  if (!baseKey) {
    return { ok: false, reason: `Unsupported key code: ${code}` }
  }

  const modifierPrefix = modifiers.map((modifier) => SUPPORTED_MODIFIERS[modifier]).join('')

  return {
    ok: true,
    key: `${modifierPrefix}${baseKey}`,
  }
}

function mapBaseTokenToSendKeys(baseToken) {
  if (!baseToken) {
    return ''
  }

  if (/^[A-Z]$/.test(baseToken)) {
    return baseToken.toLowerCase()
  }

  if (/^\d$/.test(baseToken)) {
    return baseToken
  }

  if (/^F(?:[1-9]|1[0-2])$/.test(baseToken)) {
    return `{${baseToken}}`
  }

  if (/^NUMPAD\d$/.test(baseToken)) {
    return `{${baseToken}}`
  }

  const specialMap = {
    SPACE: '{SPACE}',
    RETURN: '{ENTER}',
    ENTER: '{ENTER}',
    ESCAPE: '{ESC}',
    TAB: '{TAB}',
    BACKSPACE: '{BACKSPACE}',
    DELETE: '{DELETE}',
    INSERT: '{INSERT}',
    HOME: '{HOME}',
    END: '{END}',
    PRIOR: '{PGUP}',
    NEXT: '{PGDN}',
    UP: '{UP}',
    DOWN: '{DOWN}',
    LEFT: '{LEFT}',
    RIGHT: '{RIGHT}',
    ADD: '{ADD}',
    SUBTRACT: '{SUBTRACT}',
    MULTIPLY: '{MULTIPLY}',
    DIVIDE: '{DIVIDE}',
    DECIMAL: '{DECIMAL}',
    MINUS: '-',
    EQUALS: '=',
    LBRACKET: '[',
    RBRACKET: ']',
    BACKSLASH: '\\',
    SEMICOLON: ';',
    APOSTROPHE: "'",
    GRAVE: '`',
    COMMA: ',',
    PERIOD: '.',
    SLASH: '/',
  }

  return specialMap[baseToken] || ''
}

function resolveImportPreview(bindingsByActionId) {
  const matched = []
  const skipped = []

  for (const [action, actionId] of Object.entries(SUPPORTED_ACTION_IMPORTS)) {
    const keyboardBindings = bindingsByActionId[actionId] || []

    if (keyboardBindings.length === 0) {
      skipped.push({
        action,
        actionId,
        reason: 'No keyboard binding found in this profile.',
      })
      continue
    }

    const normalized = []
    const unsupportedReasons = []

    for (const binding of keyboardBindings) {
      const converted = convertX4CodeToSendKeys(binding.code)
      if (converted.ok) {
        normalized.push({
          rawCode: binding.code,
          key: converted.key,
        })
      } else {
        unsupportedReasons.push(converted.reason)
      }
    }

    const uniqueRawCodes = Array.from(new Set(keyboardBindings.map((binding) => binding.code)))
    const uniqueKeys = Array.from(new Set(normalized.map((binding) => binding.key)))

    if (uniqueKeys.length === 1 && uniqueRawCodes.length === 1) {
      matched.push({
        action,
        actionId,
        key: uniqueKeys[0],
        rawCode: uniqueRawCodes[0],
      })
      continue
    }

    let reason = 'Multiple keyboard bindings found; review this action manually in X4.'
    if (uniqueKeys.length === 0 && unsupportedReasons.length > 0) {
      reason = unsupportedReasons[0]
    }

    skipped.push({
      action,
      actionId,
      reason,
      codes: uniqueRawCodes,
    })
  }

  return {
    matched,
    skipped,
  }
}

function buildImportResult(status, message, extra) {
  return {
    status,
    message,
    searchedRoots: getSearchRoots(),
    matched: [],
    skipped: [],
    configPath: '',
    profilePath: '',
    ...extra,
  }
}

function detectX4KeybindingImport() {
  if (process.platform !== 'win32') {
    return buildImportResult('notAvailable', 'Import from X4 is only available on Windows.')
  }

  const candidates = findInputmapCandidates()

  if (candidates.length === 0) {
    return buildImportResult(
      'missingConfig',
      'Could not find an X4 input map under the usual Windows profile folders.',
    )
  }

  let fallbackPreview = null
  let unreadableCandidate = null

  for (const candidate of candidates) {
    try {
      const xml = fs.readFileSync(candidate.filePath, 'utf8')
      const preview = resolveImportPreview(extractKeyboardBindings(xml))

      if (preview.matched.length > 0) {
        return buildImportResult('ready', `Found ${preview.matched.length} supported X4 key binding${preview.matched.length === 1 ? '' : 's'} to review.`, {
          ...preview,
          configPath: candidate.filePath,
          profilePath: candidate.profilePath,
        })
      }

      if (!fallbackPreview) {
        fallbackPreview = {
          ...preview,
          configPath: candidate.filePath,
          profilePath: candidate.profilePath,
        }
      }
    } catch (error) {
      if (!unreadableCandidate) {
        unreadableCandidate = {
          configPath: candidate.filePath,
          profilePath: candidate.profilePath,
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
  }

  if (fallbackPreview) {
    return buildImportResult('noSupportedBindings', 'Found an X4 input map, but none of the supported launcher actions could be imported safely.', fallbackPreview)
  }

  return buildImportResult('unreadableConfig', 'Found an X4 input map, but it could not be read.', unreadableCandidate || {})
}

module.exports = {
  detectX4KeybindingImport,
}
