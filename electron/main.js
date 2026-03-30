const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, Menu, session, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')

const isDev = !app.isPackaged

let mainWindow = null
let overlayWindow = null
let nextServerProcess = null
let speechRecProcess = null
let isMicActive = false        // track mic state for overlay toggle
const PORT = 3000

// ─── File-based logging ────────────────────────────────────────────────────────
let logStream = null

function initLogger() {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const logFile = path.join(logDir, 'app.log')
    logStream = fs.createWriteStream(logFile, { flags: 'a' })
    const ts = () => new Date().toISOString()
    const orig = { log: console.log, error: console.error, warn: console.warn }
    console.log   = (...a) => { orig.log(...a);   logStream.write(`[${ts()}] INFO  ${a.join(' ')}\n`) }
    console.error = (...a) => { orig.error(...a); logStream.write(`[${ts()}] ERROR ${a.join(' ')}\n`) }
    console.warn  = (...a) => { orig.warn(...a);  logStream.write(`[${ts()}] WARN  ${a.join(' ')}\n`) }
    console.log(`=== InterviewAI started (v${app.getVersion()}) isDev=${isDev} ===`)
    console.log(`Log file: ${logFile}`)
  } catch (e) {
    // Non-fatal — logging is best-effort
  }
}

app.on('ready', initLogger)

// ─── Single-instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) { app.quit() }
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

// ─── Wait for Next.js ─────────────────────────────────────────────────────────
function waitForServer(url, retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) resolve()
        else retry()
      }).on('error', retry)
    }
    const retry = () => {
      if (retries-- <= 0) return reject(new Error('Next.js server did not start'))
      setTimeout(attempt, 1000)
    }
    attempt()
  })
}

// ─── Load .env.local bundled with the packaged app ───────────────────────────
function loadEnv() {
  try {
    const envFile = path.join(process.resourcesPath, 'app', '.env.local')
    if (!fs.existsSync(envFile)) return {}
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n')
    const env = {}
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      env[key] = val
    }
    return env
  } catch { return {} }
}

// ─── Start Next.js server (production only) ───────────────────────────────────
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) { resolve(`http://localhost:${PORT}`); return }

    const standaloneDir = path.join(process.resourcesPath, 'app', '.next', 'standalone')
    const serverScript = path.join(standaloneDir, 'server.js')
    const bundledEnv = loadEnv()

    nextServerProcess = spawn(process.execPath, [serverScript], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        ...bundledEnv,
        ELECTRON_RUN_AS_NODE: '1',
        ELECTRON_NO_ASAR: '1',
        PORT: String(PORT),
        NODE_ENV: 'production',
        NEXTAUTH_URL: `http://localhost:${PORT}`,
        HOSTNAME: '127.0.0.1',
      },
      stdio: 'pipe',
    })

    nextServerProcess.stdout.on('data', (d) => {
      process.stdout.write(d)
      logStream?.write(`[SERVER] ${d}`)
    })
    nextServerProcess.stderr.on('data', (d) => {
      process.stderr.write(d)
      logStream?.write(`[SERVER:ERR] ${d}`)
    })
    nextServerProcess.on('error', (err) => {
      console.error('Next.js server spawn error:', err)
      reject(err)
    })
    nextServerProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) console.error('Next.js server exited with code', code)
    })

    waitForServer(`http://localhost:${PORT}`)
      .then(() => resolve(`http://localhost:${PORT}`))
      .catch(reject)
  })
}

// ─── Main App Window ──────────────────────────────────────────────────────────
function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0A0F1E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  })

  const startUrl = isDev ? url : `${url}/dashboard`
  console.log('Loading URL:', startUrl)
  mainWindow.loadURL(startUrl)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })
  mainWindow.webContents.on('did-fail-load', (_e, errCode, errDesc, validatedUrl) => {
    console.error(`Page failed to load: ${errCode} ${errDesc} — ${validatedUrl}`)
  })
  mainWindow.webContents.on('console-message', (_e, level, message) => {
    const prefix = ['VERBOSE', 'INFO', 'WARN', 'ERROR'][level] ?? 'INFO'
    logStream?.write(`[RENDERER:${prefix}] ${message}\n`)
  })
  mainWindow.webContents.setWindowOpenHandler(({ url: u }) => {
    shell.openExternal(u)
    return { action: 'deny' }
  })
  mainWindow.on('closed', () => { mainWindow = null; app.quit() })
  if (!isDev) Menu.setApplicationMenu(null)
}

// ─── Overlay Window — created on demand when session starts ───────────────────
function createOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.show()
    return
  }

  const { width } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 440,
    height: 560,
    x: width - 460,
    y: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  // OS-level screen capture exclusion — invisible to Zoom, Meet, OBS, etc.
  overlayWindow.setContentProtection(true)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'))
  overlayWindow.once('ready-to-show', () => overlayWindow.show())
  overlayWindow.on('closed', () => {
    overlayWindow = null
    // When overlay is closed, make sure main window is visible
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function destroyOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.destroy()
    overlayWindow = null
  }
}

// ─── Speech Recognition helpers ───────────────────────────────────────────────
function startSpeechRec() {
  if (speechRecProcess) {
    try { speechRecProcess.kill() } catch {}
    speechRecProcess = null
  }

  // macOS / Linux: no PowerShell — signal the renderer so it immediately
  // falls back to the Groq Whisper (MediaRecorder) path
  if (process.platform !== 'win32') {
    mainWindow?.webContents.send('speech:error', 'native-sr-unavailable')
    return
  }

  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech
try {
  $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $grammar = New-Object System.Speech.Recognition.DictationGrammar
  $r.LoadGrammar($grammar)
  $r.SetInputToDefaultAudioDevice()
  $r.add_SpeechHypothesized({
    param($s, $e)
    [Console]::WriteLine('I:' + $e.Result.Text)
    [Console]::Out.Flush()
  })
  $r.add_SpeechRecognized({
    param($s, $e)
    [Console]::WriteLine('F:' + $e.Result.Text)
    [Console]::Out.Flush()
  })
  $r.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  [Console]::WriteLine('READY')
  [Console]::Out.Flush()
  while ($true) { Start-Sleep -Milliseconds 100 }
} catch {
  [Console]::WriteLine('ERROR:' + $_.Exception.Message)
  [Console]::Out.Flush()
}
`

  speechRecProcess = spawn('powershell', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psScript
  ], { stdio: 'pipe', windowsHide: true })

  let buf = ''
  speechRecProcess.stdout.on('data', (chunk) => {
    buf += chunk.toString('utf8')
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      console.log('[SR] stdout:', line)
      if (line === 'READY') {
        mainWindow?.webContents.send('speech:ready')
        isMicActive = true
        overlayWindow?.webContents.send('mic:state', { active: true })
      } else if (line.startsWith('I:')) {
        mainWindow?.webContents.send('speech:interim', line.slice(2))
      } else if (line.startsWith('F:')) {
        mainWindow?.webContents.send('speech:final', line.slice(2))
      } else if (line.startsWith('ERROR:')) {
        console.error('[SR] error:', line.slice(6))
        mainWindow?.webContents.send('speech:error', line.slice(6))
        isMicActive = false
        overlayWindow?.webContents.send('mic:state', { active: false })
      }
    }
  })

  speechRecProcess.stderr.on('data', (d) => {
    console.error('[SR] stderr:', d.toString())
  })

  speechRecProcess.on('exit', (code) => {
    console.log('[SR] process exited code', code)
    speechRecProcess = null
    isMicActive = false
    overlayWindow?.webContents.send('mic:state', { active: false })
  })

  speechRecProcess.on('error', (err) => {
    console.error('[SR] spawn error:', err.message)
    mainWindow?.webContents.send('speech:error', err.message)
    speechRecProcess = null
    isMicActive = false
    overlayWindow?.webContents.send('mic:state', { active: false })
  })
}

function stopSpeechRec() {
  if (speechRecProcess) {
    try { speechRecProcess.kill() } catch {}
    speechRecProcess = null
  }
  isMicActive = false
  overlayWindow?.webContents.send('mic:state', { active: false })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Overlay lifecycle
ipcMain.on('overlay:create', () => createOverlayWindow())
ipcMain.on('overlay:destroy', () => destroyOverlayWindow())

// Data forwarding to overlay
ipcMain.on('overlay:set-answer',   (_e, data)   => overlayWindow?.webContents.send('overlay:answer', data))
ipcMain.on('overlay:set-question', (_e, data)   => overlayWindow?.webContents.send('overlay:question', data))
ipcMain.on('overlay:set-status',   (_e, status) => overlayWindow?.webContents.send('overlay:status', status))
ipcMain.on('overlay:clear',                ()   => overlayWindow?.webContents.send('overlay:clear'))
ipcMain.on('overlay:set-opacity',  (_e, value)  => overlayWindow?.setOpacity(Math.max(0.1, Math.min(1, value))))
ipcMain.on('overlay:toggle', () => {
  if (!overlayWindow) return
  overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.show()
})
ipcMain.on('overlay:hide', () => overlayWindow?.hide())
ipcMain.on('overlay:show', () => overlayWindow?.show())

// ── Main window visibility — called when user "goes invisible" ─────────────────
ipcMain.on('main:hide', () => {
  if (mainWindow) mainWindow.hide()
})
ipcMain.on('main:show', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
})

// ── Mic toggle from overlay — mirrors start/stop logic ────────────────────────
ipcMain.on('overlay:mic-toggle', () => {
  if (isMicActive) {
    stopSpeechRec()
    overlayWindow?.webContents.send('mic:state', { active: false })
  } else {
    startSpeechRec()
    // mic:state is sent once SR sends READY
  }
})

// ── Mode change from overlay → sync to hidden main window's React state ────────
// payload: { isDesiMode: boolean, language: string }
ipcMain.on('overlay:set-mode', (_e, data) => {
  mainWindow?.webContents.send('mode:set', data)
  overlayWindow?.webContents.send('mode:confirmed', data)
})

// ── Query current mic state (overlay asks on open) ────────────────────────────
ipcMain.handle('overlay:get-mic-state', () => ({ active: isMicActive }))

ipcMain.handle('app:is-electron', () => true)
ipcMain.handle('app:platform', () => process.platform)

// ── Windows Speech Recognition via PowerShell ─────────────────────────────────
ipcMain.on('speech:start', () => startSpeechRec())
ipcMain.on('speech:stop',  () => stopSpeechRec())

// Mic permission check
ipcMain.handle('mic:check-permission', async () => {
  try {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron')
      const status = await systemPreferences.askForMediaAccess('microphone')
      return status ? 'granted' : 'denied'
    }
    return 'granted'
  } catch {
    return 'error'
  }
})

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'notifications', 'fullscreen', 'openExternal']
    callback(allowed.includes(permission))
  })
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ['media', 'mediaKeySystem', 'notifications', 'fullscreen']
    return allowed.includes(permission)
  })

  let url
  try {
    console.log('Starting Next.js server...')
    url = await startNextServer()
    console.log('Next.js server ready at', url)
  } catch (err) {
    console.error('Could not start server:', err)
    url = `http://localhost:${PORT}`
  }

  createMainWindow(url)

  // Ctrl+Shift+Space → toggle overlay visibility
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!overlayWindow) return
    overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.show()
  })
  // Ctrl+Shift+C → copy answer in overlay
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    overlayWindow?.webContents.send('overlay:copy-answer')
  })
  // Ctrl+Shift+M → toggle mic from anywhere
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (isMicActive) {
      stopSpeechRec()
    } else {
      startSpeechRec()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (nextServerProcess) { nextServerProcess.kill(); nextServerProcess = null }
  stopSpeechRec()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!mainWindow) createMainWindow(`http://localhost:${PORT}`) })
