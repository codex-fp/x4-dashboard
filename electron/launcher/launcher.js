function getInput(id) {
  return document.getElementById(id)
}

async function loadState() {
  const state = await window.x4Desktop.getState()

  const localUrl = state.localUrl || '-'
  const lanUrl = state.lanUrl || 'Unavailable on this machine'

  document.getElementById('local-url').textContent = localUrl
  document.getElementById('lan-url').textContent = lanUrl
  document.getElementById('log-path').textContent = state.logPath || '-'
  document.getElementById('startup-summary').textContent = `Port ${state.startup.port}${state.startup.mockMode ? ' · Mock mode active' : ''}`

  const statusNode = document.getElementById('server-status')
  statusNode.textContent = state.serverRunning ? 'Online' : 'Offline'
  statusNode.className = `status-pill ${state.serverRunning ? 'online' : 'offline'}`

  document.getElementById('open-local').disabled = !state.localUrl
  document.getElementById('copy-local').disabled = !state.localUrl
  document.getElementById('open-lan').disabled = !state.lanUrl
  document.getElementById('copy-lan').disabled = !state.lanUrl

  getInput('allow-remote-controls').checked = Boolean(state.runtimeConfig.allowRemoteControls)
  getInput('force-activate-game-window').checked = Boolean(state.runtimeConfig.forceActivateGameWindow)
  getInput('game-window-title').value = state.runtimeConfig.gameWindowTitle || ''
  getInput('autohotkey-path').value = state.runtimeConfig.autoHotkeyPath || ''
  document.getElementById('settings-feedback').textContent = 'Host settings are applied locally on this machine.'
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

void loadState()
