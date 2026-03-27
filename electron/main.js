const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, Menu } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

const isDev = !app.isPackaged

let mainWindow = null
let overlayWindow = null
let nextServerProcess = null
const PORT = 3000

// ─── Wait for Next.js to be ready ─────────────────────────────────────────────
function waitForServer(url, retries = 30) {
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

// ─── Start the Next.js server (production only) ───────────────────────────────
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In dev, assume `npm run dev` is already running
      resolve(`http://localhost:${PORT}`)
      return
    }

    // Production: spawn next start from the standalone build
    const appRoot = path.join(process.resourcesPath, 'app')
    const serverScript = path.join(appRoot, '.next', 'standalone', 'server.js')

    nextServerProcess = spawn(process.execPath, [serverScript], {
      cwd: path.join(appRoot, '.next', 'standalone'),
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        NEXTAUTH_URL: `http://localhost:${PORT}`,
      },
      stdio: 'inherit',
    })

    nextServerProcess.on('error', (err) => {
      console.error('Failed to start Next.js server:', err)
      reject(err)
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

  mainWindow.loadURL(url)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })

  // Remove default menu in production
  if (!isDev) Menu.setApplicationMenu(null)
}

// ─── Overlay Window (THE SCREEN-INVISIBLE PANEL) ─────────────────────────────
function createOverlayWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 440,
    height: 520,
    x: width - 460,
    y: 80,
    frame: false,          // No window chrome
    transparent: true,     // Transparent background
    alwaysOnTop: true,     // Stays above everything
    skipTaskbar: true,     // Hidden from taskbar
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  // ══════════════════════════════════════════════════════════════════════════
  // THE MAGIC LINE — tells Windows: exclude this window from ALL screen capture
  // This calls SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) under the hood
  // Result: invisible to Zoom, Google Meet, OBS, screenshots, everything
  // ══════════════════════════════════════════════════════════════════════════
  overlayWindow.setContentProtection(true)

  // Stay on top of absolutely everything — screen-saver level
  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'))

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show()
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
// From main window → overlay
ipcMain.on('overlay:set-answer', (_e, data) => {
  overlayWindow?.webContents.send('overlay:answer', data)
})

ipcMain.on('overlay:set-question', (_e, data) => {
  overlayWindow?.webContents.send('overlay:question', data)
})

ipcMain.on('overlay:set-status', (_e, status) => {
  overlayWindow?.webContents.send('overlay:status', status)
})

ipcMain.on('overlay:clear', () => {
  overlayWindow?.webContents.send('overlay:clear')
})

// From overlay → opacity control
ipcMain.on('overlay:set-opacity', (_e, value) => {
  overlayWindow?.setOpacity(Math.max(0.1, Math.min(1, value)))
})

// Toggle overlay visibility (from either window or shortcut)
ipcMain.on('overlay:toggle', () => {
  if (!overlayWindow) return
  if (overlayWindow.isVisible()) overlayWindow.hide()
  else overlayWindow.show()
})

ipcMain.on('overlay:hide', () => overlayWindow?.hide())
ipcMain.on('overlay:show', () => overlayWindow?.show())

// Check if running in Electron (renderer can call this)
ipcMain.handle('app:is-electron', () => true)
ipcMain.handle('app:platform', () => process.platform)

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  let url
  try {
    url = await startNextServer()
  } catch (err) {
    console.error('Could not start server:', err)
    // Fallback for dev: try localhost anyway
    url = `http://localhost:${PORT}`
  }

  createMainWindow(url)
  createOverlayWindow()

  // Global shortcut: Ctrl+Shift+Space = toggle overlay
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!overlayWindow) return
    if (overlayWindow.isVisible()) overlayWindow.hide()
    else overlayWindow.show()
  })

  // Ctrl+Shift+C = copy last answer (forwards to overlay)
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    overlayWindow?.webContents.send('overlay:copy-answer')
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (nextServerProcess) {
    nextServerProcess.kill()
    nextServerProcess = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!mainWindow) createMainWindow(`http://localhost:${PORT}`)
})
