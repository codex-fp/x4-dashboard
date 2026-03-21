function getInput(id) {
  return document.getElementById(id)
}

let listeningAction = null
let currentKeybindings = {}
let x4ImportPreview = null

function isEditingHostSettings() {
  if (listeningAction) {
    return true
  }

  const activeElement = document.activeElement
  if (!activeElement) return false

  return activeElement.matches('#allow-remote-controls, #force-activate-game-window, #game-window-title, #autohotkey-path, .keybinding-input, .keybinding-clear')
}

function setText(id, value) {
  document.getElementById(id).textContent = value
}

function setFeedback(id, message = '', tone = 'info') {
  const node = document.getElementById(id)
  node.textContent = message
  node.classList.remove('info', 'success', 'error')

  if (!message) {
    node.hidden = true
    return
  }

  node.classList.add(tone)
  node.hidden = false
}

const feedbackHideTimers = {}

function showTemporaryFeedback(id, message, tone = 'info', duration = 3500) {
  setFeedback(id, message, tone)

  if (feedbackHideTimers[id]) {
    window.clearTimeout(feedbackHideTimers[id])
  }

  feedbackHideTimers[id] = window.setTimeout(() => {
    setFeedback(id, '')
    feedbackHideTimers[id] = null
  }, duration)
}

function setCardState(id, status, copy, tone, linkPath = '') {
  const label = document.getElementById(id)
  const card = label.closest('.status-card')
  label.textContent = status
  label.nextElementSibling.textContent = copy
  card.classList.remove('good', 'warn', 'bad')
  if (tone) {
    card.classList.add(tone)
  }

  let linkNode = card.querySelector('.status-card-link')
  if (!linkPath) {
    if (linkNode) {
      linkNode.remove()
    }
    return
  }

  if (!linkNode) {
    linkNode = document.createElement('button')
    linkNode.className = 'status-card-link'
    card.appendChild(linkNode)
  }

  linkNode.textContent = 'Open location'
  linkNode.onclick = () => {
    void window.x4Desktop.openPath(linkPath)
  }
}

function formatBindingDisplay(keyString) {
  if (!keyString) return ''

  let raw = keyString
  const parts = []

  while (raw.startsWith('^') || raw.startsWith('+') || raw.startsWith('%')) {
    if (raw.startsWith('^')) {
      parts.push('Ctrl')
      raw = raw.slice(1)
    } else if (raw.startsWith('+')) {
      parts.push('Shift')
      raw = raw.slice(1)
    } else if (raw.startsWith('%')) {
      parts.push('Alt')
      raw = raw.slice(1)
    }
  }

  const specialMap = {
    '{SPACE}': 'Space',
    '{ENTER}': 'Enter',
    '{ESC}': 'Esc',
    '{ESCAPE}': 'Esc',
    '{TAB}': 'Tab',
    '{BACKSPACE}': 'Backspace',
    '{DELETE}': 'Delete',
    '{DEL}': 'Delete',
    '{INSERT}': 'Insert',
    '{HOME}': 'Home',
    '{END}': 'End',
    '{PGUP}': 'Page Up',
    '{PGDN}': 'Page Down',
    '{UP}': 'Up Arrow',
    '{DOWN}': 'Down Arrow',
    '{LEFT}': 'Left Arrow',
    '{RIGHT}': 'Right Arrow',
    '{ADD}': 'Numpad +',
    '{SUBTRACT}': 'Numpad -',
    '{MULTIPLY}': 'Numpad *',
    '{DIVIDE}': 'Numpad /',
    '{DECIMAL}': 'Numpad .',
    '{NUMPAD0}': 'Numpad 0',
    '{NUMPAD1}': 'Numpad 1',
    '{NUMPAD2}': 'Numpad 2',
    '{NUMPAD3}': 'Numpad 3',
    '{NUMPAD4}': 'Numpad 4',
    '{NUMPAD5}': 'Numpad 5',
    '{NUMPAD6}': 'Numpad 6',
    '{NUMPAD7}': 'Numpad 7',
    '{NUMPAD8}': 'Numpad 8',
    '{NUMPAD9}': 'Numpad 9',
  }

  const normalizedRaw = raw.toUpperCase()
  const base = specialMap[normalizedRaw] || (/^\{F(?:[1-9]|1[0-2])\}$/i.test(raw) ? raw.slice(1, -1).toUpperCase() : raw.length === 1 ? raw.toUpperCase() : raw)

  parts.push(base)
  return parts.join(' + ')
}

function normalizeCapturedKey(event) {
  if (event.metaKey) {
    return { error: 'The Windows/Command key is not supported for host key bindings.' }
  }

  if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt') {
    return { pending: true }
  }

  let baseKey = ''
  const key = event.key
  const code = event.code

  if (/^Key[A-Z]$/.test(code)) {
    baseKey = code.slice(3).toLowerCase()
  } else if (/^Digit[0-9]$/.test(code)) {
    baseKey = code.slice(5)
  } else if (/^Numpad[0-9]$/.test(code)) {
    baseKey = `{NUMPAD${code.slice(6)}}`
  } else {
    const numpadCodeMap = {
      NumpadAdd: '{ADD}',
      NumpadSubtract: '{SUBTRACT}',
      NumpadMultiply: '{MULTIPLY}',
      NumpadDivide: '{DIVIDE}',
      NumpadDecimal: '{DECIMAL}',
    }

    const printableCodeMap = {
      Minus: '-',
      Equal: '=',
      BracketLeft: '[',
      BracketRight: ']',
      Backslash: '\\',
      Semicolon: ';',
      Quote: "'",
      Backquote: '`',
      Comma: ',',
      Period: '.',
      Slash: '/',
    }

    baseKey = numpadCodeMap[code] || printableCodeMap[code] || ''
  }

  if (!baseKey && /^[a-z0-9]$/i.test(key)) {
    baseKey = key.toLowerCase()
  } else if (!baseKey && /^F(?:[1-9]|1[0-2])$/i.test(key)) {
    baseKey = `{${key.toUpperCase()}}`
  } else if (!baseKey) {
    const specialKeys = {
      ' ': '{SPACE}',
      Enter: '{ENTER}',
      Escape: '{ESC}',
      Tab: '{TAB}',
      Backspace: '{BACKSPACE}',
      Delete: '{DELETE}',
      Insert: '{INSERT}',
      Home: '{HOME}',
      End: '{END}',
      PageUp: '{PGUP}',
      PageDown: '{PGDN}',
      ArrowUp: '{UP}',
      ArrowDown: '{DOWN}',
      ArrowLeft: '{LEFT}',
      ArrowRight: '{RIGHT}',
    }

    baseKey = specialKeys[key] || ''
  }

  if (!baseKey) {
    return { error: `Unsupported key: ${key}` }
  }

  let normalizedKey = baseKey

  if (event.altKey) normalizedKey = `%${normalizedKey}`
  if (event.shiftKey) normalizedKey = `+${normalizedKey}`
  if (event.ctrlKey) normalizedKey = `^${normalizedKey}`

  return {
    key: normalizedKey,
    display: formatBindingDisplay(normalizedKey),
  }
}

function clearListeningFeedback() {
  const node = document.getElementById('keybinding-listen-hint')
  if (node) {
    node.textContent = ''
    node.hidden = true
  }
}

function setListeningFeedback(message) {
  const node = document.getElementById('keybinding-listen-hint')
  if (node) {
    node.textContent = message
    node.hidden = !message
  }
}

function stopListening(message = '', tone = 'info') {
  listeningAction = null
  clearListeningFeedback()
  renderKeybindings(currentKeybindings)

  if (message) {
    showTemporaryFeedback('keybindings-feedback', message, tone)
  }
}

function startListening(action) {
  if (listeningAction === action) {
    stopListening('Capture cancelled.', 'info')
    return
  }

  listeningAction = action
  const binding = currentKeybindings[action]
  renderKeybindings(currentKeybindings)
  setListeningFeedback(`Listening for ${binding?.label || action}. Press a key or key combination.`)
  setFeedback('keybindings-feedback', 'Listening for keyboard input...', 'info')
}

async function applyCapturedBinding(action, key, display) {
  let conflictAction = null

  for (const [otherAction, binding] of Object.entries(currentKeybindings)) {
    if (otherAction !== action && binding?.key === key) {
      conflictAction = otherAction
      currentKeybindings[otherAction] = {
        ...binding,
        key: '',
      }
      break
    }
  }

  currentKeybindings[action] = {
    ...currentKeybindings[action],
    key,
  }

  listeningAction = null
  clearListeningFeedback()
  renderKeybindings(currentKeybindings)

  const conflictLabel = conflictAction ? currentKeybindings[conflictAction]?.label || conflictAction : ''
  const feedback = conflictAction
    ? `Saved ${display} for ${currentKeybindings[action]?.label || action}. Cleared ${conflictLabel}.`
    : `Saved ${display} for ${currentKeybindings[action]?.label || action}.`

  try {
    await saveKeybindings(feedback)
  } catch {
    // saveKeybindings already handles the visible error state
  }
}

function clearBinding(action) {
  const binding = currentKeybindings[action]
  currentKeybindings[action] = {
    ...binding,
    key: '',
  }
  listeningAction = null
  clearListeningFeedback()
  renderKeybindings(currentKeybindings)
  void saveKeybindings(`Cleared ${binding?.label || action}.`)
}

function getActionLabel(action) {
  return currentKeybindings[action]?.label || action
}

function createImportReviewItem(title, description) {
  const item = document.createElement('article')
  item.className = 'import-review-item'

  const titleNode = document.createElement('strong')
  titleNode.textContent = title

  const descriptionNode = document.createElement('span')
  descriptionNode.textContent = description

  item.append(titleNode, descriptionNode)
  return item
}

function dismissX4ImportReview() {
  x4ImportPreview = null
  document.getElementById('x4-import-review').hidden = true
}

function renderX4ImportReview(result) {
  x4ImportPreview = result || null

  const reviewNode = document.getElementById('x4-import-review')
  const matchedList = document.getElementById('x4-import-matched-list')
  const skippedList = document.getElementById('x4-import-skipped-list')
  const matchedEmpty = document.getElementById('x4-import-matched-empty')
  const skippedSection = document.getElementById('x4-import-skipped-section')
  const sourceNode = document.getElementById('x4-import-source')
  const applyButton = document.getElementById('apply-x4-import')

  if (!result) {
    dismissX4ImportReview()
    return
  }

  reviewNode.hidden = false
  setText('x4-import-status', result.status === 'ready' ? 'Ready to import' : 'No changes applied')
  setText('x4-import-message', result.message || '')
  setText('x4-import-matched-count', String(result.matched?.length || 0))
  setText('x4-import-skipped-count', String(result.skipped?.length || 0))

  if (result.configPath) {
    sourceNode.hidden = false
    sourceNode.textContent = `Detected profile: ${result.configPath}`
  } else {
    sourceNode.hidden = true
    sourceNode.textContent = ''
  }

  matchedList.innerHTML = ''
  for (const item of result.matched || []) {
    matchedList.appendChild(createImportReviewItem(
      getActionLabel(item.action),
      `${formatBindingDisplay(item.key)} from ${item.rawCode}`,
    ))
  }

  matchedEmpty.hidden = Boolean(result.matched?.length)

  skippedList.innerHTML = ''
  for (const item of result.skipped || []) {
    skippedList.appendChild(createImportReviewItem(getActionLabel(item.action), item.reason))
  }

  skippedSection.hidden = !(result.skipped && result.skipped.length > 0)
  applyButton.hidden = !(result.status === 'ready' && result.matched && result.matched.length > 0)
}

function renderKeybindings(keybindings) {
  currentKeybindings = keybindings || {}

  const listNode = document.getElementById('keybindings-list')
  listNode.innerHTML = ''

  for (const [action, binding] of Object.entries(keybindings || {})) {
    const row = document.createElement('div')
    row.className = 'keybinding-row'
    if (listeningAction === action) {
      row.classList.add('is-listening')
    }

    const meta = document.createElement('div')
    meta.className = 'keybinding-meta'

    const label = document.createElement('div')
    label.className = 'keybinding-label'
    label.textContent = binding.label

    const description = document.createElement('div')
    description.className = 'keybinding-description'
    description.textContent = binding.description

    meta.append(label, description)

    const input = document.createElement('input')
    input.className = 'keybinding-input'
    input.type = 'text'
    input.value = listeningAction === action ? 'Listening...' : formatBindingDisplay(binding.key || '')
    input.placeholder = 'Click and press a key'
    input.spellcheck = false
    input.readOnly = true
    input.dataset.action = action
    input.dataset.key = binding.key || ''
    input.title = listeningAction === action
      ? 'Press a key to save, or click again to cancel'
      : (binding.key || 'Click to capture a key binding')
    input.addEventListener('click', () => {
      startListening(action)
    })

    const actions = document.createElement('div')
    actions.className = 'keybinding-actions'

    const clearButton = document.createElement('button')
    clearButton.className = 'secondary-button keybinding-clear'
    clearButton.textContent = 'Clear'
    clearButton.disabled = !binding.key
    clearButton.addEventListener('click', () => {
      clearBinding(action)
    })

    actions.append(clearButton)
    row.append(meta, input, actions)
    listNode.appendChild(row)
  }
}

async function loadState() {
  const state = await window.x4Desktop.getState()
  const editingHostSettings = isEditingHostSettings()

  const localUrl = state.localUrl || '-'
  const lanUrl = state.lanUrl || 'Unavailable on this machine'

  setText('local-url', localUrl)
  setText('lan-url', lanUrl)
  setText('log-path', state.logPath || '-')
  setText('startup-summary', `Port ${state.startup.port}${state.startup.mockMode ? ' · Mock mode active' : ''}`)

  const statusNode = document.getElementById('server-status')
  statusNode.textContent = state.serverRunning ? 'Online' : 'Offline'
  statusNode.className = `status-pill ${state.serverRunning ? 'online' : 'offline'}`
  setText('server-mode', state.usingExistingServer ? 'Connected to an already running local server on this port.' : 'Launcher is hosting its own local server process.')

  const startupAlert = document.getElementById('startup-alert')
  if (state.startupError) {
    startupAlert.hidden = false
    setText('startup-alert-copy', state.startupError)
  } else {
    startupAlert.hidden = true
    setText('startup-alert-copy', '-')
  }

  document.getElementById('open-local').disabled = !state.localUrl
  document.getElementById('copy-local').disabled = !state.localUrl
  document.getElementById('open-lan').disabled = !state.lanUrl
  document.getElementById('copy-lan').disabled = !state.lanUrl

  const health = state.health || null
  setText('client-count', `${health?.wsClientCount || 0} connected`)
  setText('remote-controls-status', health?.remoteControlsEnabled ? 'LAN enabled' : 'Local only')
  setText('remote-controls-copy', health?.remoteControlsEnabled
    ? 'Trusted LAN clients can trigger host-side control actions.'
    : 'Dashboard viewing works over LAN, but control endpoints stay on the host machine.')

  const ahk = state.diagnostics?.autoHotkey
  setCardState(
    'ahk-status',
    ahk?.available ? 'Detected' : 'Not detected',
    ahk?.available
      ? `Using ${ahk.resolvedPath}`
      : 'AutoHotkey is optional, but recommended for reliable in-game button presses on Windows.',
    ahk?.available ? 'good' : 'warn',
    ahk?.available ? ahk.resolvedPath : '',
  )

  const lanDetected = Boolean(state.diagnostics?.lanDetected && state.lanUrl)
  setCardState(
    'lan-detected-status',
    lanDetected ? 'LAN URL ready' : 'LAN IP unavailable',
    lanDetected
      ? 'Other devices on the same trusted network can open the LAN URL directly.'
      : 'Connect the host to a local network to enable multi-device browser access.',
    lanDetected ? '' : 'warn',
  )

  const gameInstall = state.diagnostics?.gameInstall
  setCardState(
    'game-path-status',
    gameInstall?.available ? 'Detected' : 'Not detected',
    gameInstall?.available
      ? gameInstall.resolvedPath
      : 'Could not detect a local X4 installation path automatically. You can still use mock mode or continue configuring the bridge manually.',
    gameInstall?.available ? 'good' : 'warn',
    gameInstall?.available ? gameInstall.resolvedPath : '',
  )

  const bridgeInstall = state.diagnostics?.bridgeInstall
  setCardState(
    'game-feed-status',
    bridgeInstall?.available
      ? (health?.externalConnected ? 'Detected and connected' : 'Detected')
      : (state.startup.mockMode ? 'Mock feed active' : 'Bridge not found'),
    bridgeInstall?.available
      ? bridgeInstall.resolvedPath
      : 'Install the x4_dashboard_bridge extension into the X4 extensions folder to receive real game data.',
    bridgeInstall?.available ? 'good' : 'warn',
    bridgeInstall?.available ? bridgeInstall.resolvedPath : '',
  )

  if (!editingHostSettings) {
    getInput('allow-remote-controls').checked = Boolean(state.runtimeConfig.allowRemoteControls)
    getInput('force-activate-game-window').checked = Boolean(state.runtimeConfig.forceActivateGameWindow)
    getInput('game-window-title').value = state.runtimeConfig.gameWindowTitle || ''
    getInput('autohotkey-path').value = state.runtimeConfig.autoHotkeyPath || ''

    renderKeybindings(state.keybindings?.bindings)
  }

}

function bindAction(id, handler) {
  document.getElementById(id).addEventListener('click', handler)
}

let runtimeConfigSaveTimer = null

async function saveRuntimeConfig(feedback = 'Host settings saved.') {
  setFeedback('settings-feedback', 'Saving...', 'info')

  const nextConfig = {
    allowRemoteControls: getInput('allow-remote-controls').checked,
    forceActivateGameWindow: getInput('force-activate-game-window').checked,
    gameWindowTitle: getInput('game-window-title').value,
    autoHotkeyPath: getInput('autohotkey-path').value,
  }

  try {
    await window.x4Desktop.updateRuntimeConfig(nextConfig)
    showTemporaryFeedback('settings-feedback', feedback, 'success')
    await loadState()
  } catch (error) {
    showTemporaryFeedback('settings-feedback', error instanceof Error ? error.message : 'Failed to save settings.', 'error', 5000)
  }
}

function scheduleRuntimeConfigSave(feedback = 'Host settings saved.') {
  if (runtimeConfigSaveTimer) {
    window.clearTimeout(runtimeConfigSaveTimer)
  }

  runtimeConfigSaveTimer = window.setTimeout(() => {
    runtimeConfigSaveTimer = null
    void saveRuntimeConfig(feedback)
  }, 300)
}

async function saveKeybindings(feedback = 'Key bindings saved.') {
  setFeedback('keybindings-feedback', 'Saving...', 'info')

  try {
    const updates = {}
    document.querySelectorAll('.keybinding-input').forEach((input) => {
      updates[input.dataset.action] = { key: input.dataset.key || '' }
    })

    const next = await window.x4Desktop.updateKeybindings(updates)
    currentKeybindings = next.bindings || {}
    showTemporaryFeedback('keybindings-feedback', feedback, 'success')
    await loadState()
  } catch (error) {
    showTemporaryFeedback('keybindings-feedback', error instanceof Error ? error.message : 'Failed to save key bindings.', 'error', 5000)
    throw error
  }
}

async function detectX4Import() {
  if (listeningAction) {
    stopListening('Capture cancelled before scanning X4 bindings.', 'info')
  }

  const button = document.getElementById('import-x4')
  button.disabled = true
  setFeedback('keybindings-feedback', 'Scanning X4 profiles...', 'info')

  try {
    const result = await window.x4Desktop.detectX4Keybindings()
    renderX4ImportReview(result)
    setFeedback('keybindings-feedback', '')
  } catch (error) {
    renderX4ImportReview({
      status: 'unreadableConfig',
      message: error instanceof Error ? error.message : 'Failed to scan X4 key bindings.',
      matched: [],
      skipped: [],
    })
    showTemporaryFeedback('keybindings-feedback', 'Failed to scan X4 key bindings.', 'error', 5000)
  } finally {
    button.disabled = false
  }
}

async function applyX4Import() {
  const matched = x4ImportPreview?.matched || []
  if (!matched.length) {
    return
  }

  const updates = {}
  for (const item of matched) {
    updates[item.action] = { key: item.key }
  }

  setFeedback('keybindings-feedback', 'Importing X4 bindings...', 'info')

  try {
    const next = await window.x4Desktop.updateKeybindings(updates)
    currentKeybindings = next.bindings || {}
    renderKeybindings(currentKeybindings)
    dismissX4ImportReview()
    showTemporaryFeedback('keybindings-feedback', `Imported ${matched.length} X4 binding${matched.length === 1 ? '' : 's'}.`, 'success')
    await loadState()
  } catch (error) {
    showTemporaryFeedback('keybindings-feedback', error instanceof Error ? error.message : 'Failed to import X4 key bindings.', 'error', 5000)
  }
}

bindAction('refresh-status', () => {
  void loadState()
})

window.setInterval(() => {
  void loadState()
}, 3000)

bindAction('open-local', async () => {
  const state = await window.x4Desktop.getState()
  if (state.localUrl) await window.x4Desktop.openUrl(state.localUrl)
})

bindAction('copy-local', async () => {
  const state = await window.x4Desktop.getState()
  if (state.localUrl) await window.x4Desktop.copyText(state.localUrl)
})

bindAction('open-lan', async () => {
  const state = await window.x4Desktop.getState()
  if (state.lanUrl) await window.x4Desktop.openUrl(state.lanUrl)
})

bindAction('copy-lan', async () => {
  const state = await window.x4Desktop.getState()
  if (state.lanUrl) await window.x4Desktop.copyText(state.lanUrl)
})

bindAction('open-log', () => {
  void window.x4Desktop.showLogLocation()
})

bindAction('import-x4', () => {
  void detectX4Import()
})

bindAction('apply-x4-import', () => {
  void applyX4Import()
})

bindAction('dismiss-x4-import', () => {
  dismissX4ImportReview()
})

getInput('allow-remote-controls').addEventListener('change', () => {
  void saveRuntimeConfig('Host settings saved.')
})

getInput('force-activate-game-window').addEventListener('change', () => {
  void saveRuntimeConfig('Host settings saved.')
})

getInput('game-window-title').addEventListener('input', () => {
  scheduleRuntimeConfigSave('Host settings saved.')
})

getInput('autohotkey-path').addEventListener('input', () => {
  scheduleRuntimeConfigSave('Host settings saved.')
})

window.addEventListener('keydown', (event) => {
  if (!listeningAction) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  if (event.repeat) {
    return
  }

  const captured = normalizeCapturedKey(event)

  if (captured.pending) {
    return
  }

  if (captured.error) {
    showTemporaryFeedback('keybindings-feedback', captured.error, 'error', 5000)
    return
  }

  void applyCapturedBinding(listeningAction, captured.key, captured.display)
})

window.addEventListener('blur', () => {
  if (listeningAction) {
    stopListening('Capture cancelled because the launcher lost focus.', 'info')
  }
})

void loadState()
