// win.webContents.openDevTools();
const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, Menu, Tray, nativeImage, session, desktopCapturer } = require('electron')
// const Store = require('./store.js')  // DISABLED - ESM conflict
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

let mainWindow = null
let tray = null
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
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    resizable: true,
    minWidth: 380,
    minHeight: 500,
    skipTaskbar: true,
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

  // Windows WDA_EXCLUDEFROMCAPTURE - ultimate stealth (Windows 10+)
  if (process.platform === 'win32') {
    try {
      const hwnd = mainWindow.getNativeWindowHandle()
      const user32 = require('ffi-napi').Library('user32', {
        'SetWindowDisplayAffinity': ['bool', ['int', 'uint']]
      })
      user32.SetWindowDisplayAffinity(hwnd.readInt16LE(), 0x00000100) // WDA_EXCLUDEFROMCAPTURE
    } catch (e) {
      console.warn('[STEALTH] WDA_EXCLUDEFROMCAPTURE failed:', e.message)
    }
  }

  // Always load /interview — Next.js will redirect to /login if not authenticated
  // The login page receives callbackUrl=/interview so after login it returns here
  const startUrl = isDev
    ? `${url}/interview?callbackUrl=${encodeURIComponent('/interview')}`
    : `${url}/interview`
  console.log('Loading URL:', startUrl)
  mainWindow.loadURL(startUrl)

  mainWindow.once('ready-to-show', () => {
    // Apply saved opacity
    const savedOpacity = settingsData.opacity || 0.95
    mainWindow.setOpacity(savedOpacity)
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
    // Send saved settings to renderer after page loads
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send('settings:init', {
        opacity: savedOpacity,
        fontSize: settingsData.fontSize || 13,
        sttProvider: settingsData.sttProvider || 'windows',
        model: settingsData.model || 'llama-3.3-70b-versatile',
      })
    })
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
  // Intercept close (Alt+F4, taskbar close) — hide instead of quit
  // User can only truly quit via the system tray "Quit" option
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide()
    tray?.displayBalloon({
      title: 'InterviewAI is still running',
      content: 'Right-click the tray icon to quit, or press Ctrl+Shift+H to show.',
      iconType: 'info',
    })
  })
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

// ─── System Tray ─────────────────────────────────────────────────────────────
// Tray is the only way to show the window after it is hidden, or to quit the app.
function createTray() {
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const iconPath = isDev
    ? path.join(__dirname, '../public', iconFile)
    : path.join(process.resourcesPath, 'app/.next/standalone/public', iconFile)

  try {
    let icon
    try {
      icon = nativeImage.createFromPath(iconPath)
      if (icon.isEmpty()) throw new Error('empty icon')
    } catch {
      // Fallback: tiny 1×1 transparent PNG so tray still appears
      icon = nativeImage.createEmpty()
    }

    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    tray.setToolTip('InterviewAI  —  Ctrl+Shift+H to show/hide')

    const buildMenu = () => Menu.buildFromTemplate([
      {
        label: mainWindow?.isVisible() ? 'Hide window' : 'Show window',
        click: () => {
          if (mainWindow?.isVisible()) { mainWindow.hide() }
          else { mainWindow?.show(); mainWindow?.focus() }
          // Rebuild so label reflects current state
          tray.setContextMenu(buildMenu())
        },
      },
      { type: 'separator' },
      {
        label: 'Sign Out',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
          mainWindow?.webContents.send('auth:signout')
        },
      },
      { type: 'separator' },
      {
        label: 'Quit InterviewAI',
        click: () => {
          // Allow the close event to proceed normally then quit
          mainWindow?.removeAllListeners('close')
          app.quit()
        },
      },
    ])

    tray.setContextMenu(buildMenu())

    // Left-click tray icon → toggle window visibility
    tray.on('click', () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow?.show()
        mainWindow?.focus()
      }
      tray.setContextMenu(buildMenu())
    })

    console.log('System tray created')
  } catch (e) {
    console.error('Failed to create system tray:', e.message)
  }
}

// ─── Simple JSON Store (electron-store ESM conflict workaround) ──────────────
const userDataPath = app.getPath('userData')
const settingsPath = path.join(userDataPath, 'stealth-settings.json')

let settingsData = {}
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
  } catch {}
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2))
  } catch {}
}

loadSettings()

// IPC
ipcMain.handle('settings:get', () => settingsData)
ipcMain.handle('settings:set', async (_e, key, value) => {
  settingsData[key] = value
  saveSettings()
})
ipcMain.handle('settings:keys', () => Object.keys(settingsData))

// NEW: Overlay opacity sync from renderer
ipcMain.on('set-overlay-opacity', (_e, opacityPercent) => {
  if (mainWindow && typeof opacityPercent === 'number') {
    const opacity = Math.max(0.15, Math.min(1, opacityPercent / 100))
    mainWindow.setOpacity(opacity)
    console.log(`[OVERLAY] Set opacity to ${opacityPercent}% (${opacity.toFixed(2)})`)
  }
})

// ─── Main-Process AI (openai-chat IPC) ───────────────────────────────────────
ipcMain.handle('ai:chat', async (event, { question, context = {}, isDesiMode = false, interviewType = 'technical', language = 'en-US', qaHistory = [] }) => {
  const model = settingsData.model || 'llama-3.3-70b-versatile'
  const apiUrl = `http://localhost:${PORT}/api/ai/interview-answer`
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context,
        isDesiMode,
        interviewType,
        language: isDesiMode ? 'en-IN' : language,
        qaHistory: qaHistory.slice(-4)
      })
    })

    if (!response.ok || !response.body) {
      return { error: 'API request failed' }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullAnswer = ''
    let firstChunk = true

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6).trim()
        if (data === '[DONE]') {
          event.sender.send('ai:done', { fullAnswer })
          return { success: true, answer: fullAnswer }
        }

        try {
          const parsed = JSON.parse(data)
          if (firstChunk && parsed.mode) {
            event.sender.send('ai:mode', parsed.mode)
            firstChunk = false
            continue
          }
          const token = parsed.text || parsed.delta?.text || ''
          if (token) {
            fullAnswer += token
            event.sender.send('ai:chunk', { token })
          }
        } catch {}
      }
    }

    event.sender.send('ai:done', { fullAnswer })
    return { success: true, answer: fullAnswer }
  } catch (err) {
    event.sender.send('ai:error', err.message)
    return { error: err.message }
  }
})

// ─── Whisper STT Fallback (4s chunks) ────────────────────────────────────────
ipcMain.handle('stt:whisper', async (event, audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'chunk.webm')
  
  try {
    const response = await fetch(`http://localhost:${PORT}/api/ai/transcribe`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      return { error: 'Transcription failed' }
    }
    
    const { text } = await response.json()
    event.sender.send('stt:result', text)
    return { text }
  } catch (err) {
    event.sender.send('stt:error', err.message)
    return { error: err.message }
  }
})

// ─── Window controls IPC ──────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:hide',     () => {
  mainWindow?.hide()
  tray?.displayBalloon({
    title: 'InterviewAI is still running',
    content: 'Right-click the tray icon to quit, or press Ctrl+Shift+H to show.',
    iconType: 'info',
  })
})
ipcMain.on('window:close', () => {
  mainWindow?.removeAllListeners('close')
  app.quit()
})

// Move window (left / center / right snap)
ipcMain.on('overlay:move-window', (_e, dir) => moveWindow(dir))

// Toggle/show/hide overlay (window)
ipcMain.on('overlay:toggle', () => {
  if (mainWindow?.isVisible()) mainWindow.hide()
  else { mainWindow?.show(); mainWindow?.focus() }
})
ipcMain.on('overlay:show', () => { mainWindow?.show(); mainWindow?.focus() })
ipcMain.on('overlay:hide', () => mainWindow?.hide())
ipcMain.on('main:hide',    () => mainWindow?.hide())
ipcMain.on('main:show',    () => { mainWindow?.show(); mainWindow?.focus() })

// Mic state query
ipcMain.handle('overlay:get-mic-state', () => ({ active: isMicActive }))

// Platform info
ipcMain.handle('app:platform', () => process.platform)

// ─── Existing IPC (kept for compatibility) ───────────────────────────────────
// Overlay lifecycle
ipcMain.on('overlay:create',  () => { /* no-op */ })
ipcMain.on('overlay:destroy', () => { /* no-op */ })

// Data forwarding
ipcMain.on('overlay:set-answer',   (_e, data)   => mainWindow?.webContents.send('overlay:answer', data))
ipcMain.on('overlay:set-question', (_e, data)   => mainWindow?.webContents.send('overlay:question', data))
ipcMain.on('overlay:set-status',   (_e, status) => mainWindow?.webContents.send('overlay:status', status))
ipcMain.on('overlay:clear',        ()           => mainWindow?.webContents.send('overlay:clear'))
ipcMain.on('overlay:set-opacity',  (_e, value)  => mainWindow?.setOpacity(Math.max(0.1, Math.min(1, value))))

// Window visibility & controls (unchanged...)

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

// Stealth Screenshot IPC (hide → wait 300ms → capture → show)
ipcMain.handle('screenshot:stealth-capture', async () => {
  if (!mainWindow) return null
  const wasVisible = mainWindow.isVisible()
  if (wasVisible) mainWindow.hide()
  
  // Wait 300ms for any visual feedback to fade
  await new Promise(r => setTimeout(r, 300))
  
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080, quality: 0.8 },
    })
    const result = sources[0]?.thumbnail.toDataURL('image/jpeg', 0.8) ?? null
    
    if (wasVisible) mainWindow.show()
    return result
  } catch (err) {
    console.error('stealth-capture error:', err)
    if (wasVisible) mainWindow.show()
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
  createTray()

  // ── Global shortcuts — ALL Ctrl+Shift+{key} ───────────────────────────────

  // Toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
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
// Don't quit when all windows are closed — the tray keeps the app alive
app.on('window-all-closed', () => { /* stay in tray */ })
app.on('activate', () => { if (!mainWindow) createMainWindow(`http://localhost:${PORT}`) })
