const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── Overlay lifecycle ──────────────────────────────────────────────────────
  createOverlay:  () => ipcRenderer.send('overlay:create'),
  destroyOverlay: () => ipcRenderer.send('overlay:destroy'),

  // ── Mic permission ─────────────────────────────────────────────────────────
  checkMicPermission: () => ipcRenderer.invoke('mic:check-permission'),

  // ── Data → overlay ─────────────────────────────────────────────────────────
  sendAnswer:   (data)   => ipcRenderer.send('overlay:set-answer', data),
  sendQuestion: (text)   => ipcRenderer.send('overlay:set-question', { text }),
  setStatus:    (status) => ipcRenderer.send('overlay:set-status', status),
  clearOverlay: ()       => ipcRenderer.send('overlay:clear'),

  // ── Overlay visibility ─────────────────────────────────────────────────────
  toggleOverlay: () => ipcRenderer.send('overlay:toggle'),
  showOverlay:   () => ipcRenderer.send('overlay:show'),
  hideOverlay:   () => ipcRenderer.send('overlay:hide'),
  setOpacity:    (value) => ipcRenderer.send('overlay:set-opacity', value),

  // ── Main window visibility (used when "going invisible") ───────────────────
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  showMainWindow: () => ipcRenderer.send('main:show'),

  // ── Overlay ↔ main window mode sync ───────────────────────────────────────
  setModeFromOverlay: (data) => ipcRenderer.send('overlay:set-mode', data),
  onModeSet: (cb) => { ipcRenderer.on('mode:set', (_e, data) => cb(data)) },

  // ── Mic toggle from overlay ────────────────────────────────────────────────
  toggleMicFromOverlay: () => ipcRenderer.send('overlay:mic-toggle'),
  getMicState: () => ipcRenderer.invoke('overlay:get-mic-state'),
  onMicState: (cb) => { ipcRenderer.on('mic:state', (_e, state) => cb(state)) },

  // ── Listeners (overlay receives data pushed from main process) ─────────────
  onAnswer:     (cb) => { ipcRenderer.on('overlay:answer',       (_e, data)   => cb(data)) },
  onQuestion:   (cb) => { ipcRenderer.on('overlay:question',     (_e, data)   => cb(data)) },
  onStatus:     (cb) => { ipcRenderer.on('overlay:status',       (_e, status) => cb(status)) },
  onClear:      (cb) => { ipcRenderer.on('overlay:clear',        ()           => cb()) },
  onCopyAnswer: (cb) => { ipcRenderer.on('overlay:copy-answer',  ()           => cb()) },
  onModeConfirmed: (cb) => { ipcRenderer.on('mode:confirmed', (_e, data) => cb(data)) },

  // ── Manual question: overlay → main React app ─────────────────────────────
  // Called from overlay to send a typed question (+ optional screenshots) to AI
  sendManualQuestion: (data) => ipcRenderer.send('overlay:manual-question', data),
  // Called from main React app to receive manual questions forwarded from overlay
  onManualQuestion: (cb) => { ipcRenderer.on('manual:question', (_e, data) => cb(data)) },

  // ── Screenshot capture ─────────────────────────────────────────────────────
  // Overlay invokes this; main process captures screen and returns base64 dataUrl
  captureScreen: () => ipcRenderer.invoke('screen:capture'),

  // ── Session stop ───────────────────────────────────────────────────────────
  stopSession: () => ipcRenderer.send('overlay:stop-session'),
  // Main React app listens for stop signal (triggered by global shortcut)
  onStopSession: (cb) => { ipcRenderer.on('session:stop', () => cb()) },

  // ── Overlay commands pushed from global shortcuts in main.js ──────────────
  onFontSize:    (cb) => { ipcRenderer.on('overlay:font-size',   (_e, dir)    => cb(dir)) },
  onScroll:      (cb) => { ipcRenderer.on('overlay:scroll',      (_e, dir)    => cb(dir)) },
  onFocusInput:  (cb) => { ipcRenderer.on('overlay:focus-input', ()           => cb()) },
  onClearInput:  (cb) => { ipcRenderer.on('overlay:clear-input', ()           => cb()) },
  // Screenshot pushed from main.js global shortcut (Ctrl+Shift+S)
  onScreenshot:  (cb) => { ipcRenderer.on('overlay:screenshot',  (_e, dataUrl) => cb(dataUrl)) },

  // ── Window position ────────────────────────────────────────────────────────
  moveWindow: (dir) => ipcRenderer.send('overlay:move-window', dir),

  // ── Windows Speech Recognition ─────────────────────────────────────────────
  startSpeechRecognition: () => ipcRenderer.send('speech:start'),
  stopSpeechRecognition:  () => ipcRenderer.send('speech:stop'),
  onSpeechReady:   (cb) => { ipcRenderer.on('speech:ready',   ()           => cb()) },
  onSpeechInterim: (cb) => { ipcRenderer.on('speech:interim', (_e, text)   => cb(text)) },
  onSpeechFinal:   (cb) => { ipcRenderer.on('speech:final',   (_e, text)   => cb(text)) },
  onSpeechError:   (cb) => { ipcRenderer.on('speech:error',   (_e, msg)    => cb(msg)) },

  removeAllListeners: (channel) => { ipcRenderer.removeAllListeners(channel) },
})
