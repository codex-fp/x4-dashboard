const { app, BrowserWindow, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const SERVER_PORT = process.env.PORT || '3001'
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`
const DEV_RENDERER_URL = process.env.ELECTRON_RENDERER_URL || ''
const IS_DEV = Boolean(DEV_RENDERER_URL)
const LOG_FILE_NAME = 'server.log'

let mainWindow = null
let serverProcess = null
let isQuitting = false
let serverLogBuffer = ''

function appendServerLog(chunk) {
  serverLogBuffer += chunk

  if (IS_DEV) {
    return
  }

  try {
    const logPath = path.join(app.getPath('userData'), LOG_FILE_NAME)
    fs.appendFileSync(logPath, chunk)
  } catch {}
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServerReady(url, retries = 80) {
  for (let index = 0; index < retries; index += 1) {
    try {
      const response = await fetch(`${url}/api/health`)
      if (response.ok) {
        return
      }
    } catch {}

    await wait(500)
  }

  throw new Error(`Timed out waiting for server at ${url}`)
}

function startServerProcess() {
  if (IS_DEV) {
    return Promise.resolve()
  }

  const serverEntry = getServerEntry()
  const logPath = path.join(app.getPath('userData'), LOG_FILE_NAME)
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Cannot find packaged server entry: ${serverEntry}`)
  }

  serverLogBuffer = ''

  try {
    fs.writeFileSync(logPath, '')
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

  serverProcess.on('exit', (code) => {
    if (!isQuitting && code !== 0) {
      const logPath = path.join(app.getPath('userData'), LOG_FILE_NAME)
      dialog.showErrorBox(
        'X4 Dashboard',
        `Bundled server stopped unexpectedly (exit code ${code ?? 'unknown'}).\n\nCheck: ${logPath}`,
      )
      app.quit()
    }
  })

  return waitForServerReady(SERVER_URL)
}

function stopServerProcess() {
  if (!serverProcess) {
    return
  }

  serverProcess.kill()
  serverProcess = null
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1280,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#000d12',
    title: 'X4 Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const targetUrl = IS_DEV ? DEV_RENDERER_URL : SERVER_URL
  mainWindow.loadURL(targetUrl)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(async () => {
  try {
    await startServerProcess()
    createWindow()
  } catch (error) {
    dialog.showErrorBox('X4 Dashboard', error instanceof Error ? error.message : 'Failed to start the application.')
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
