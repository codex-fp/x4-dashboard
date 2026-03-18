function getInput(id) {
  return document.getElementById(id)
}

function setText(id, value) {
  document.getElementById(id).textContent = value
}

function setCardState(id, status, copy, tone) {
  const label = document.getElementById(id)
  const card = label.closest('.status-card')
  label.textContent = status
  label.nextElementSibling.textContent = copy
  card.classList.remove('good', 'warn', 'bad')
  card.classList.add(tone)
}

function renderKeybindings(keybindings) {
  const listNode = document.getElementById('keybindings-list')
  listNode.innerHTML = ''

  for (const [action, binding] of Object.entries(keybindings || {})) {
    const row = document.createElement('div')
    row.className = 'keybinding-row'

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
    input.value = binding.key || ''
    input.placeholder = 'e.g. {F1}'
    input.spellcheck = false
    input.dataset.action = action

    const testButton = document.createElement('button')
    testButton.className = 'secondary-button keybinding-test'
    testButton.textContent = 'Test'
    testButton.addEventListener('click', async () => {
      const feedbackNode = document.getElementById('keybindings-feedback')
      feedbackNode.textContent = `Testing ${binding.label}...`

      try {
        await window.x4Desktop.testKeybinding(action)
        feedbackNode.textContent = `${binding.label} sent.`
      } catch (error) {
        feedbackNode.textContent = error instanceof Error ? error.message : 'Failed to test keybinding.'
      }
    })

    row.append(meta, input, testButton)
    listNode.appendChild(row)
  }
}

async function loadState() {
  const state = await window.x4Desktop.getState()

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
  setText('game-feed-status', health?.externalConnected ? 'Bridge connected' : (state.startup.mockMode ? 'Mock feed active' : 'Waiting for X4 Bridge'))
  setText('game-feed-copy', health?.externalConnected
    ? 'The server is receiving game or mock payloads.'
    : 'Start X4 with the x4_dashboard_bridge extension enabled, or use mock mode for previewing.')
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
  )

  const lanDetected = Boolean(state.diagnostics?.lanDetected && state.lanUrl)
  setCardState(
    'lan-detected-status',
    lanDetected ? 'LAN URL ready' : 'LAN IP unavailable',
    lanDetected
      ? 'Other devices on the same trusted network can open the LAN URL directly.'
      : 'Connect the host to a local network to enable multi-device browser access.',
    lanDetected ? 'good' : 'warn',
  )

  const gameInstall = state.diagnostics?.gameInstall
  setCardState(
    'game-path-status',
    gameInstall?.available ? 'Detected' : 'Not detected',
    gameInstall?.available
      ? gameInstall.resolvedPath
      : 'Could not detect a local X4 installation path automatically. You can still use mock mode or continue configuring the bridge manually.',
    gameInstall?.available ? 'good' : 'warn',
  )

  getInput('allow-remote-controls').checked = Boolean(state.runtimeConfig.allowRemoteControls)
  getInput('force-activate-game-window').checked = Boolean(state.runtimeConfig.forceActivateGameWindow)
  getInput('game-window-title').value = state.runtimeConfig.gameWindowTitle || ''
  getInput('autohotkey-path').value = state.runtimeConfig.autoHotkeyPath || ''

  renderKeybindings(state.keybindings?.bindings)

  setText('settings-feedback', 'Host settings are applied locally on this machine.')
  setText('keybindings-feedback', 'Key bindings are stored on the host machine.')
}

function bindAction(id, handler) {
  document.getElementById(id).addEventListener('click', handler)
}

bindAction('refresh-status', () => {
  void loadState()
})

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

bindAction('save-settings', async () => {
  const feedbackNode = document.getElementById('settings-feedback')
  feedbackNode.textContent = 'Saving...'

  try {
    await window.x4Desktop.updateRuntimeConfig({
      allowRemoteControls: getInput('allow-remote-controls').checked,
      forceActivateGameWindow: getInput('force-activate-game-window').checked,
      gameWindowTitle: getInput('game-window-title').value,
      autoHotkeyPath: getInput('autohotkey-path').value,
    })

    feedbackNode.textContent = 'Host settings saved.'
    await loadState()
  } catch (error) {
    feedbackNode.textContent = error instanceof Error ? error.message : 'Failed to save settings.'
  }
})

bindAction('save-keybindings', async () => {
  const feedbackNode = document.getElementById('keybindings-feedback')
  feedbackNode.textContent = 'Saving...'

  try {
    const updates = {}
    document.querySelectorAll('.keybinding-input').forEach((input) => {
      updates[input.dataset.action] = { key: input.value }
    })

    await window.x4Desktop.updateKeybindings(updates)
    feedbackNode.textContent = 'Key bindings saved.'
    await loadState()
  } catch (error) {
    feedbackNode.textContent = error instanceof Error ? error.message : 'Failed to save key bindings.'
  }
})

void loadState()
