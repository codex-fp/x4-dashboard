const { app, BrowserWindow, clipboard, dialog, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const { execFileSync } = require('child_process')

const SERVER_PORT = process.env.PORT || '3001'
const LOCAL_SERVER_URL = `http://localhost:${SERVER_PORT}`
const DEV_RENDERER_URL = process.env.ELECTRON_RENDERER_URL || ''
const IS_DEV = Boolean(DEV_RENDERER_URL)
const LOG_FILE_NAME = 'server.log'

process.env.X4_USER_DATA_PATH = app.getPath('userData')

let mainWindow = null
let serverProcess = null
let isQuitting = false
let usingExistingServer = false
let startupError = ''

function getLauncherIconPath() {
  if (IS_DEV) {
    return path.join(__dirname, 'assets', 'icon.ico')
  }

  return path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'assets', 'icon.ico')
}

function getPublicIndexPath() {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'server', 'public', 'index.html')
  }

  return path.join(process.resourcesPath, 'server', 'public', 'index.html')
}

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

function getAutoHotkeyCandidates(customPath) {
  return [
    customPath,
    'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey64.exe',
    'C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey32.exe',
    'C:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
  ].filter(Boolean)
}

function getAutoHotkeyStatus(runtimeConfig) {
  const candidates = getAutoHotkeyCandidates(runtimeConfig.autoHotkeyPath)
  const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate)) || ''

  return {
    available: Boolean(resolvedPath),
    resolvedPath,
    usingCustomPath: Boolean(runtimeConfig.autoHotkeyPath),
  }
}

function normalizeWindowsPath(value) {
  return value ? value.replace(/\//g, '\\') : ''
}

function getSteamInstallPath() {
  if (process.platform !== 'win32') {
    return ''
  }

  try {
    const output = execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      "(Get-ItemProperty 'HKCU:\\Software\\Valve\\Steam' -ErrorAction SilentlyContinue).SteamPath",
    ], { encoding: 'utf8' }).trim()

    return normalizeWindowsPath(output)
  } catch {
    return ''
  }
}

function getSteamLibraryPaths() {
  const steamPath = getSteamInstallPath()
  const libraries = new Set()

  if (steamPath) {
    libraries.add(steamPath)

    const libraryFile = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
    if (fs.existsSync(libraryFile)) {
      const content = fs.readFileSync(libraryFile, 'utf8')
      const matches = content.matchAll(/"path"\s+"([^"]+)"/g)
      for (const match of matches) {
        libraries.add(normalizeWindowsPath(match[1].replace(/\\\\/g, '\\')))
      }
    }
  }

  return Array.from(libraries)
}

function getGameInstallStatus() {
  const candidates = []

  for (const library of getSteamLibraryPaths()) {
    candidates.push(path.join(library, 'steamapps', 'common', 'X4 Foundations'))
  }

  candidates.push(
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\X4 Foundations',
    'C:\\Program Files\\Steam\\steamapps\\common\\X4 Foundations',
  )

  const uniqueCandidates = Array.from(new Set(candidates.map(normalizeWindowsPath)))
  const resolvedPath = uniqueCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'X4.exe')) || fs.existsSync(path.join(candidate, 'extensions'))) || ''

  return {
    available: Boolean(resolvedPath),
    resolvedPath,
  }
}

function getBridgeInstallStatus(gameInstallStatus) {
  if (!gameInstallStatus?.resolvedPath) {
    return {
      available: false,
      resolvedPath: '',
    }
  }

  const bridgePath = path.join(gameInstallStatus.resolvedPath, 'extensions', 'x4_dashboard_bridge')

  return {
    available: fs.existsSync(bridgePath),
    resolvedPath: bridgePath,
  }
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

function getX4KeybindingsImportPath() {
  return path.join(__dirname, 'x4KeybindingsImport.cjs')
}

function getX4KeybindingsImport() {
  const modulePath = getX4KeybindingsImportPath()
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

async function fetchLocalJson(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}

async function readRuntimeConfigForLauncher(serverRunning) {
  if (serverRunning) {
    try {
      return await fetchLocalJson(`${LOCAL_SERVER_URL}/api/runtime-config`)
    } catch {}
  }

  return getRuntimeConfigStore().readRuntimeConfig()
}

async function readKeybindingsForLauncher(serverRunning) {
  if (serverRunning) {
    try {
      return await fetchLocalJson(`${LOCAL_SERVER_URL}/api/keybindings`)
    } catch {}
  }

  return getKeybindingsStore().readKeybindings()
}

async function getLauncherState(serverRunning) {
  const lanAddress = getLanAddress()
  const runtimeConfig = await readRuntimeConfigForLauncher(serverRunning)
  const keybindings = await readKeybindingsForLauncher(serverRunning)
  const health = await getServerHealth()
  const gameInstall = getGameInstallStatus()

  return {
    serverRunning,
    usingExistingServer,
    startupError,
    localUrl: IS_DEV ? DEV_RENDERER_URL : LOCAL_SERVER_URL,
    lanUrl: lanAddress ? `http://${lanAddress}:${SERVER_PORT}` : null,
    logPath: getLogPath(),
    runtimeConfig,
    keybindings,
    health,
    diagnostics: {
      autoHotkey: getAutoHotkeyStatus(runtimeConfig),
      lanDetected: Boolean(lanAddress),
      gameInstall,
      bridgeInstall: getBridgeInstallStatus(gameInstall),
    },
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

  return isServerReachable().then((reachable) => {
    if (reachable) {
      usingExistingServer = true
      startupError = ''
      return
    }

    usingExistingServer = false
    startupError = ''

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
        X4_USER_DATA_PATH: app.getPath('userData'),
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
        startupError = `Bundled server stopped unexpectedly (exit code ${code ?? 'unknown'}). Check: ${getLogPath()}`
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launcher:state', await getLauncherState(await isServerReachable()))
      }

      if (!isQuitting && code !== 0) {
        dialog.showErrorBox('X4 Dashboard Server', startupError)
      }
    })

    return waitForServerReady()
  })
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
  ipcMain.handle('launcher:open-path', async (_event, targetPath) => {
    if (!targetPath) {
      return
    }

    const normalizedPath = path.normalize(targetPath)
    if (fs.existsSync(normalizedPath)) {
      const stats = fs.statSync(normalizedPath)
      if (stats.isDirectory()) {
        shell.openPath(normalizedPath)
      } else {
        shell.showItemInFolder(normalizedPath)
      }
    }
  })
  ipcMain.handle('launcher:update-runtime-config', async (_event, updates) => {
    if (await isServerReachable()) {
      try {
        return await fetchLocalJson(`${LOCAL_SERVER_URL}/api/runtime-config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates || {}),
        })
      } catch {}
    }

    const runtimeConfigStore = getRuntimeConfigStore()
    const current = runtimeConfigStore.readRuntimeConfig()
    const next = runtimeConfigStore.mergeRuntimeConfigUpdates(current, updates || {})
    runtimeConfigStore.writeRuntimeConfig(next)
    return next
  })
  ipcMain.handle('launcher:update-keybindings', async (_event, updates) => {
    if (await isServerReachable()) {
      try {
        return await fetchLocalJson(`${LOCAL_SERVER_URL}/api/keybindings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bindings: updates || {} }),
        })
      } catch {}
    }

    const keybindingsStore = getKeybindingsStore()
    const current = keybindingsStore.readKeybindings()
    const next = keybindingsStore.mergeKeybindingUpdates(current, updates || {})
    keybindingsStore.writeKeybindings(next)
    return next
  })
  ipcMain.handle('launcher:detect-x4-keybindings', async () => getX4KeybindingsImport().detectX4KeybindingImport())
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
    icon: getLauncherIconPath(),
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
    createWindow()
    await startServerProcess()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.once('did-finish-load', async () => {
        mainWindow.webContents.send('launcher:state', await getLauncherState(await isServerReachable()))
      })
    }
  } catch (error) {
    startupError = error instanceof Error ? error.message : 'Failed to start the launcher.'
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.once('did-finish-load', async () => {
        mainWindow.webContents.send('launcher:state', await getLauncherState(false))
      })
    } else {
      dialog.showErrorBox('X4 Dashboard Server', startupError)
      app.quit()
    }
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
