const { app, BrowserWindow, clipboard, dialog, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')

const SERVER_PORT = process.env.PORT || '3001'
const LOCAL_SERVER_URL = `http://localhost:${SERVER_PORT}`
const DEV_RENDERER_URL = process.env.ELECTRON_RENDERER_URL || ''
const IS_DEV = Boolean(DEV_RENDERER_URL)
const LOG_FILE_NAME = 'server.log'

let mainWindow = null
let serverProcess = null
let isQuitting = false

function getServerEntry() {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'server', 'index.js')
  }

  return path.join(process.resourcesPath, 'server', 'index.js')
}

function getServerCwd() {
  if (IS_DEV) {
    return path.join(__dirname, '..')
  }

  return process.resourcesPath
}

function getLogPath() {
  return path.join(app.getPath('userData'), LOG_FILE_NAME)
}

function getRuntimeConfigStorePath() {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'server', 'runtimeConfigStore.js')
  }

  return path.join(process.resourcesPath, 'server', 'runtimeConfigStore.js')
}

function getRuntimeConfigStore() {
  const storePath = getRuntimeConfigStorePath()
  delete require.cache[storePath]
  return require(storePath)
}

function getKeybindingsStorePath() {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'server', 'keybindingsStore.js')
  }

  return path.join(process.resourcesPath, 'server', 'keybindingsStore.js')
}

function getKeybindingsStore() {
  const storePath = getKeybindingsStorePath()
  delete require.cache[storePath]
  return require(storePath)
}

function getKeyPresserPath() {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'server', 'keyPresser.js')
  }

  return path.join(process.resourcesPath, 'server', 'keyPresser.js')
}

function getKeyPresser() {
  const modulePath = getKeyPresserPath()
  delete require.cache[modulePath]
  return require(modulePath)
}

function getLanAddress() {
  return Object.values(os.networkInterfaces())
    .flat()
    .find((iface) => iface && iface.family === 'IPv4' && !iface.internal)?.address || null
}

async function getServerHealth() {
  const healthUrl = IS_DEV ? `http://localhost:${SERVER_PORT}/api/health` : `${LOCAL_SERVER_URL}/api/health`

  try {
    const response = await fetch(healthUrl)
    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

async function getLauncherState(serverRunning) {
  const lanAddress = getLanAddress()
  const runtimeConfigStore = getRuntimeConfigStore()
  const keybindingsStore = getKeybindingsStore()
  const health = await getServerHealth()

  return {
    serverRunning,
    localUrl: IS_DEV ? DEV_RENDERER_URL : LOCAL_SERVER_URL,
    lanUrl: lanAddress ? `http://${lanAddress}:${SERVER_PORT}` : null,
    logPath: getLogPath(),
    runtimeConfig: runtimeConfigStore.readRuntimeConfig(),
    keybindings: keybindingsStore.readKeybindings(),
    health,
    startup: {
      port: Number(SERVER_PORT),
      mockMode: process.argv.includes('--mock') || process.env.MOCK === 'true',
    },
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isServerReachable() {
  const healthUrl = IS_DEV ? `http://localhost:${SERVER_PORT}/api/health` : `${LOCAL_SERVER_URL}/api/health`

  try {
    const response = await fetch(healthUrl)
    return response.ok
  } catch {
    return false
  }
}

async function waitForServerReady(retries = 80) {
  for (let index = 0; index < retries; index += 1) {
    if (await isServerReachable()) {
      return
    }

    await wait(500)
  }

  throw new Error(`Timed out waiting for server on port ${SERVER_PORT}`)
}

function appendServerLog(chunk) {
  if (IS_DEV) {
    return
  }

  try {
    fs.appendFileSync(getLogPath(), chunk)
  } catch {}
}

function startServerProcess() {
  if (IS_DEV) {
    return Promise.resolve()
  }

  const serverEntry = getServerEntry()
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Cannot find packaged server entry: ${serverEntry}`)
  }

  try {
    fs.writeFileSync(getLogPath(), '')
  } catch {}

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: getServerCwd(),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: SERVER_PORT,
    },
    stdio: 'pipe',
    windowsHide: true,
  })

  serverProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    appendServerLog(text)
    process.stdout.write(`[server] ${text}`)
  })

  serverProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    appendServerLog(text)
    process.stderr.write(`[server] ${text}`)
  })

  serverProcess.on('exit', async (code) => {
    if (!isQuitting && code !== 0) {
      dialog.showErrorBox(
        'X4 Dashboard Server',
        `Bundled server stopped unexpectedly (exit code ${code ?? 'unknown'}).\n\nCheck: ${getLogPath()}`,
      )
      app.quit()
      return
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launcher:state', await getLauncherState(await isServerReachable()))
    }
  })

  return waitForServerReady()
}

function stopServerProcess() {
  if (!serverProcess) {
    return
  }

  serverProcess.kill()
  serverProcess = null
}

function registerIpc() {
  ipcMain.handle('launcher:get-state', async () => getLauncherState(await isServerReachable()))
  ipcMain.handle('launcher:open-url', async (_event, url) => shell.openExternal(url))
  ipcMain.handle('launcher:copy-text', async (_event, text) => clipboard.writeText(text))
  ipcMain.handle('launcher:update-runtime-config', async (_event, updates) => {
    const runtimeConfigStore = getRuntimeConfigStore()
    const current = runtimeConfigStore.readRuntimeConfig()
    const next = runtimeConfigStore.mergeRuntimeConfigUpdates(current, updates || {})

    runtimeConfigStore.writeRuntimeConfig(next)
    return next
  })
  ipcMain.handle('launcher:update-keybindings', async (_event, updates) => {
    const keybindingsStore = getKeybindingsStore()
    const current = keybindingsStore.readKeybindings()
    const next = keybindingsStore.mergeKeybindingUpdates(current, updates || {})

    keybindingsStore.writeKeybindings(next)
    return next
  })
  ipcMain.handle('launcher:test-keybinding', async (_event, action) => {
    const keybindingsStore = getKeybindingsStore()
    const keyPresser = getKeyPresser()
    const current = keybindingsStore.readKeybindings()
    const binding = current.bindings?.[action]

    if (!binding) {
      throw new Error(`Unknown action: ${action}`)
    }

    keyPresser.press(binding.key, binding.modifiers || [])
    return { ok: true }
  })
  ipcMain.handle('launcher:show-log-location', async () => {
    const logPath = getLogPath()

    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '')
    }

    shell.showItemInFolder(logPath)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 820,
    minHeight: 620,
    autoHideMenuBar: true,
    backgroundColor: '#071218',
    title: 'X4 Dashboard Server',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'launcher', 'index.html'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(async () => {
  registerIpc()

  try {
    await startServerProcess()
    createWindow()
  } catch (error) {
    dialog.showErrorBox('X4 Dashboard Server', error instanceof Error ? error.message : 'Failed to start the launcher.')
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  stopServerProcess()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
