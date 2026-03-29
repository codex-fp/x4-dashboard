const { app, BrowserWindow, clipboard, dialog, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const { execFileSync } = require('child_process')

const SERVER_PORT = process.env.PORT || '3001'
const CLIENT_PORT = process.env.CLIENT_PORT || '3000'
const LOCAL_SERVER_URL = `http://localhost:${SERVER_PORT}`
const LOCAL_CLIENT_URL = `http://localhost:${CLIENT_PORT}`
const DEV_MODE = !app.isPackaged
const IS_MOCK = process.env.MOCK === 'true'
const LOG_FILE_NAME = 'server.log'

process.env.X4_USER_DATA_PATH = app.getPath('userData')

let mainWindow = null
let serverProcess = null
let viteProcess = null
let isQuitting = false
let startupError = ''

function getLauncherIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'launcher', 'assets', 'icon.ico')
  }
  return path.join(__dirname, 'assets', 'icon.ico')
}

function getPublicIndexPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'public', 'index.html')
  }
  return path.join(__dirname, '..', 'server', 'public', 'index.html')
}

function getServerEntry() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'index.js')
  }
  return path.join(__dirname, '..', 'server', 'index.js')
}

function getServerCwd() {
  if (app.isPackaged) {
    return process.resourcesPath
  }
  return path.join(__dirname, '..')
}

function getClientCwd() {
  if (app.isPackaged) {
    return process.resourcesPath
  }
  return path.join(__dirname, '..', 'client')
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
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'runtimeConfigStore.js')
  }
  return path.join(__dirname, '..', 'server', 'runtimeConfigStore.js')
}

function getRuntimeConfigStore() {
  const storePath = getRuntimeConfigStorePath()
  delete require.cache[storePath]
  return require(storePath)
}

function getKeybindingsStorePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'keybindingsStore.js')
  }
  return path.join(__dirname, '..', 'server', 'keybindingsStore.js')
}

function getKeybindingsStore() {
  const storePath = getKeybindingsStorePath()
  delete require.cache[storePath]
  return require(storePath)
}

function getKeyPresserPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'keyPresser.js')
  }
  return path.join(__dirname, '..', 'server', 'keyPresser.js')
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
  const healthUrl = `${LOCAL_SERVER_URL}/api/health`

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
    startupError,
    localUrl: DEV_MODE ? LOCAL_CLIENT_URL : LOCAL_SERVER_URL,
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
      mockMode: IS_MOCK,
      devMode: DEV_MODE,
    },
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isServerReachable() {
  const healthUrl = `${LOCAL_SERVER_URL}/api/health`

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
  if (app.isPackaged) {
    try {
      fs.appendFileSync(getLogPath(), chunk)
    } catch {}
  }
}

function startServerProcess() {
  return isServerReachable().then((reachable) => {
    if (reachable) {
      startupError = ''
      return
    }

    startupError = ''

    const serverEntry = getServerEntry()
    if (!fs.existsSync(serverEntry)) {
      throw new Error(`Cannot find server entry: ${serverEntry}`)
    }

    try {
      fs.writeFileSync(getLogPath(), '')
    } catch {}

    const args = [serverEntry]
    if (IS_MOCK) {
      args.push('--mock')
    }

    serverProcess = spawn(process.execPath, args, {
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
      if (DEV_MODE) {
        process.stdout.write(`[server] ${text}`)
      }
    })

    serverProcess.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      appendServerLog(text)
      if (DEV_MODE) {
        process.stderr.write(`[server] ${text}`)
      }
    })

    serverProcess.on('exit', async (code) => {
      if (!isQuitting && code !== 0) {
        startupError = `Server stopped unexpectedly (exit code ${code ?? 'unknown'}). Check: ${getLogPath()}`
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

function waitForClientReady(retries = 40) {
  return new Promise((resolve) => {
    const check = async (attempt = 0) => {
      try {
        const response = await fetch(LOCAL_CLIENT_URL)
        if (response.ok) {
          resolve()
          return
        }
      } catch {}
      
      if (attempt < retries) {
        setTimeout(() => check(attempt + 1), 500)
      } else {
        console.log('[vite] Timeout waiting for Vite, continuing anyway')
        resolve()
      }
    }
    check()
  })
}

function startViteProcess() {
  if (!DEV_MODE) {
    console.log('[vite] Not in dev mode, skipping Vite')
    return Promise.resolve()
  }

  const vitePath = path.join(__dirname, '..', 'client', 'node_modules', '.bin', 'vite.cmd')
  console.log(`[vite] Looking for Vite at: ${vitePath}`)
  console.log(`[vite] Vite exists: ${fs.existsSync(vitePath)}`)
  console.log(`[vite] Client cwd: ${getClientCwd()}`)
  
  if (!fs.existsSync(vitePath)) {
    console.log('[vite] Vite not found, skipping dev client')
    return Promise.resolve()
  }

  console.log('[vite] Starting Vite dev server...')
  viteProcess = spawn('cmd.exe', ['/c', vitePath], {
    cwd: getClientCwd(),
    env: {
      ...process.env,
      VITE_WS_URL: `ws://localhost:${SERVER_PORT}`,
    },
    stdio: 'pipe',
    windowsHide: false,
  })

  console.log(`[vite] Vite process started with PID: ${viteProcess.pid}`)

  viteProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    process.stdout.write(`[vite] ${text}`)
  })

  viteProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    process.stderr.write(`[vite] ${text}`)
  })

  viteProcess.on('exit', (code) => {
    console.log(`[vite] Vite process exited with code ${code}`)
    if (!isQuitting && code !== 0) {
      console.error(`[vite] Vite exited unexpectedly with code ${code}`)
    }
  })

  viteProcess.on('error', (err) => {
    console.error(`[vite] Failed to start Vite: ${err.message}`)
  })

  return waitForClientReady()
}

function stopProcesses() {
  isQuitting = true
  
  if (viteProcess) {
    viteProcess.kill()
    viteProcess = null
  }
  
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
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

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (DEV_MODE) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(async () => {
  registerIpc()

  try {
    createWindow()
    await startServerProcess()
    await startViteProcess()
    
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
  stopProcesses()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
