const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, Menu, session, desktopCapturer } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')

const isDev = !app.isPackaged

let mainWindow = null
let nextServerProcess = null
let speechRecProcess = null
let isMicActive = false
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
  } catch (e) { /* non-fatal */ }
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
    nextServerProcess.on('error', (err) => { console.error('Next.js server spawn error:', err); reject(err) })
    nextServerProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) console.error('Next.js server exited with code', code)
    })

    waitForServer(`http://localhost:${PORT}`)
      .then(() => resolve(`http://localhost:${PORT}`))
      .catch(reject)
  })
}

// ─── Overlay window (invisible to screen recorders) ──────────────────────────
// The main window IS the overlay — no separate overlay.html needed.
function createMainWindow(url) {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const winW = 460
  const winH = Math.round(sh * 0.92)
  const winX = sw - winW - 16
  const winY = Math.round(sh * 0.04)

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: winX,
    y: winY,
    frame: false,                 // no title bar — app renders its own drag handle
    backgroundColor: '#0A0F1E',
    resizable: true,
    minWidth: 380,
    minHeight: 500,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  })

  // ── OS-level screen capture exclusion ──────────────────────────────────────
  // Makes the window invisible to Zoom, Meet, Teams, OBS, etc.
  mainWindow.setContentProtection(true)
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Always load /interview — Next.js will redirect to /login if not authenticated
  // The login page receives callbackUrl=/interview so after login it returns here
  const startUrl = isDev
    ? `${url}/interview?callbackUrl=${encodeURIComponent('/interview')}`
    : `${url}/interview`
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

// ─── Window position helper (3-stop cycling: left / center / right) ──────────
function moveWindow(dir) {
  if (!mainWindow) return
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const [ow, oh] = mainWindow.getSize()
  const [cx, cy] = mainWindow.getPosition()
  const margin    = 16
  const snapLeft   = margin
  const snapCenter = Math.floor((sw - ow) / 2)
  const snapRight  = sw - ow - margin
  const threshold  = 80

  let nextX = cx
  if (dir === 'right') {
    if (cx <= snapLeft + threshold)        nextX = snapCenter
    else if (cx <= snapCenter + threshold) nextX = snapRight
    else                                   nextX = snapLeft
  } else if (dir === 'left') {
    if (cx >= snapRight - threshold)       nextX = snapCenter
    else if (cx >= snapCenter - threshold) nextX = snapLeft
    else                                   nextX = snapRight
  }
  mainWindow.setPosition(nextX, Math.max(0, Math.min(cy, sh - oh)))
}

// ─── Speech Recognition ───────────────────────────────────────────────────────
function startSpeechRec() {
  if (speechRecProcess) {
    try { speechRecProcess.kill() } catch {}
    speechRecProcess = null
  }

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
      if (line === 'READY') {
        mainWindow?.webContents.send('speech:ready')
        isMicActive = true
        mainWindow?.webContents.send('mic:state', { active: true })
      } else if (line.startsWith('I:')) {
        mainWindow?.webContents.send('speech:interim', line.slice(2))
      } else if (line.startsWith('F:')) {
        mainWindow?.webContents.send('speech:final', line.slice(2))
      } else if (line.startsWith('ERROR:')) {
        console.error('[SR] error:', line.slice(6))
        mainWindow?.webContents.send('speech:error', line.slice(6))
        isMicActive = false
        mainWindow?.webContents.send('mic:state', { active: false })
      }
    }
  })

  speechRecProcess.stderr.on('data', (d) => console.error('[SR] stderr:', d.toString()))
  speechRecProcess.on('exit', (code) => {
    console.log('[SR] process exited code', code)
    speechRecProcess = null
    isMicActive = false
    mainWindow?.webContents.send('mic:state', { active: false })
  })
  speechRecProcess.on('error', (err) => {
    console.error('[SR] spawn error:', err.message)
    mainWindow?.webContents.send('speech:error', err.message)
    speechRecProcess = null
    isMicActive = false
    mainWindow?.webContents.send('mic:state', { active: false })
  })
}

function stopSpeechRec() {
  if (speechRecProcess) { try { speechRecProcess.kill() } catch {} speechRecProcess = null }
  isMicActive = false
  mainWindow?.webContents.send('mic:state', { active: false })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Overlay lifecycle — no-ops in new design (main window IS the overlay)
ipcMain.on('overlay:create',  () => { /* no-op */ })
ipcMain.on('overlay:destroy', () => { /* no-op */ })

// Data forwarding (main process → renderer)
ipcMain.on('overlay:set-answer',   (_e, data)   => mainWindow?.webContents.send('overlay:answer', data))
ipcMain.on('overlay:set-question', (_e, data)   => mainWindow?.webContents.send('overlay:question', data))
ipcMain.on('overlay:set-status',   (_e, status) => mainWindow?.webContents.send('overlay:status', status))
ipcMain.on('overlay:clear',        ()           => mainWindow?.webContents.send('overlay:clear'))
ipcMain.on('overlay:set-opacity',  (_e, value)  => mainWindow?.setOpacity(Math.max(0.1, Math.min(1, value))))

// Window visibility
ipcMain.on('overlay:toggle', () => {
  if (!mainWindow) return
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
})
ipcMain.on('overlay:hide',   () => mainWindow?.hide())
ipcMain.on('overlay:show',   () => { mainWindow?.show(); mainWindow?.focus() })
ipcMain.on('main:hide',      () => mainWindow?.hide())
ipcMain.on('main:show',      () => { mainWindow?.show(); mainWindow?.focus() })

// Window controls (called from drag handle buttons in UI)
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:hide',     () => mainWindow?.hide())
ipcMain.on('window:close',    () => { mainWindow?.destroy(); app.quit() })

// Window positioning
ipcMain.on('overlay:move-window', (_e, dir) => moveWindow(dir))

// Mic
ipcMain.on('overlay:mic-toggle', () => {
  if (isMicActive) stopSpeechRec()
  else             startSpeechRec()
})
ipcMain.on('overlay:set-mode', (_e, data) => {
  mainWindow?.webContents.send('mode:set', data)
  mainWindow?.webContents.send('mode:confirmed', data)
})

ipcMain.handle('overlay:get-mic-state', () => ({ active: isMicActive }))
ipcMain.handle('app:is-electron', () => true)
ipcMain.handle('app:platform', () => process.platform)

// Speech recognition
ipcMain.on('speech:start', () => startSpeechRec())
ipcMain.on('speech:stop',  () => stopSpeechRec())

// Mic permission
ipcMain.handle('mic:check-permission', async () => {
  try {
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron')
      const status = await systemPreferences.askForMediaAccess('microphone')
      return status ? 'granted' : 'denied'
    }
    return 'granted'
  } catch { return 'error' }
})

// Manual question (from overlay forward)
ipcMain.on('overlay:manual-question', (_e, data) => {
  mainWindow?.webContents.send('manual:question', data)
})

// Stop session
ipcMain.on('overlay:stop-session', () => {
  stopSpeechRec()
  mainWindow?.webContents.send('session:stop')
})

// Screen capture (IPC invoke from renderer)
ipcMain.handle('screen:capture', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    })
    return sources[0]?.thumbnail.toDataURL() ?? null
  } catch (err) {
    console.error('screen:capture error:', err)
    return null
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

  // ── Global shortcuts — ALL Ctrl+Shift+{key} ───────────────────────────────

  // Toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  // Mic toggle
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (isMicActive) stopSpeechRec()
    else             startSpeechRec()
  })

  // Screenshot + auto-send to AI
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      })
      const dataUrl = sources[0]?.thumbnail.toDataURL()
      if (dataUrl) {
        // Send screenshot AND trigger immediate AI send
        mainWindow?.webContents.send('overlay:screenshot-send', dataUrl)
      }
    } catch (err) {
      console.error('Screenshot shortcut error:', err)
    }
  })

  // Send current question to AI (Ctrl+Shift+E)
  globalShortcut.register('CommandOrControl+Shift+E', () => {
    mainWindow?.webContents.send('overlay:send-question')
  })

  // Clear question input
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('overlay:clear-input')
  })

  // Scroll answer up / down
  globalShortcut.register('CommandOrControl+Shift+Up',   () => mainWindow?.webContents.send('overlay:scroll', 'up'))
  globalShortcut.register('CommandOrControl+Shift+Down', () => mainWindow?.webContents.send('overlay:scroll', 'down'))

  // Move window left / right
  globalShortcut.register('CommandOrControl+Shift+Left',  () => moveWindow('left'))
  globalShortcut.register('CommandOrControl+Shift+Right', () => moveWindow('right'))

  // Copy answer
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    mainWindow?.webContents.send('overlay:copy-answer')
  })

  // Stop session
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    stopSpeechRec()
    mainWindow?.webContents.send('session:stop')
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (nextServerProcess) { nextServerProcess.kill(); nextServerProcess = null }
  stopSpeechRec()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!mainWindow) createMainWindow(`http://localhost:${PORT}`) })
