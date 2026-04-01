const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── Overlay lifecycle (no-ops — main window IS the overlay) ───────────────
  createOverlay:  () => { /* no-op */ },
  destroyOverlay: () => { /* no-op */ },

  // ── Mic permission ─────────────────────────────────────────────────────────
  checkMicPermission: () => ipcRenderer.invoke('mic:check-permission'),

  // ── Data → overlay (legacy forwarding kept for compat) ────────────────────
  sendAnswer:   (data)   => ipcRenderer.send('overlay:set-answer', data),
  sendQuestion: (text)   => ipcRenderer.send('overlay:set-question', { text }),
  setStatus:    (status) => ipcRenderer.send('overlay:set-status', status),
  clearOverlay: ()       => ipcRenderer.send('overlay:clear'),

  // ── Window visibility ──────────────────────────────────────────────────────
  toggleOverlay:  () => ipcRenderer.send('overlay:toggle'),
  showOverlay:    () => ipcRenderer.send('overlay:show'),
  hideOverlay:    () => ipcRenderer.send('overlay:hide'),
  setOpacity:     (value) => ipcRenderer.send('overlay:set-opacity', value),
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  showMainWindow: () => ipcRenderer.send('main:show'),

  // ── Window controls (drag handle buttons) ─────────────────────────────────
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  hideWindow:     () => ipcRenderer.send('window:hide'),
  closeWindow:    () => ipcRenderer.send('window:close'),

  // ── Window position ────────────────────────────────────────────────────────
  moveWindow: (dir) => ipcRenderer.send('overlay:move-window', dir),

  // ── Mode sync ─────────────────────────────────────────────────────────────
  setModeFromOverlay: (data) => ipcRenderer.send('overlay:set-mode', data),
  onModeSet:          (cb)   => { ipcRenderer.on('mode:set',       (_e, data) => cb(data)) },
  onModeConfirmed:    (cb)   => { ipcRenderer.on('mode:confirmed', (_e, data) => cb(data)) },

  // ── Mic ───────────────────────────────────────────────────────────────────
  toggleMicFromOverlay: () => ipcRenderer.send('overlay:mic-toggle'),
  getMicState:  () => ipcRenderer.invoke('overlay:get-mic-state'),
  onMicState:   (cb) => { ipcRenderer.on('mic:state', (_e, state) => cb(state)) },

  // ── Listeners (data pushed from main process) ──────────────────────────────
  onAnswer:     (cb) => { ipcRenderer.on('overlay:answer',      (_e, data)   => cb(data)) },
  onQuestion:   (cb) => { ipcRenderer.on('overlay:question',    (_e, data)   => cb(data)) },
  onStatus:     (cb) => { ipcRenderer.on('overlay:status',      (_e, status) => cb(status)) },
  onClear:      (cb) => { ipcRenderer.on('overlay:clear',       ()           => cb()) },
  onCopyAnswer: (cb) => { ipcRenderer.on('overlay:copy-answer', ()           => cb()) },

  // ── Manual question: overlay → main React app ─────────────────────────────
  sendManualQuestion: (data) => ipcRenderer.send('overlay:manual-question', data),
  onManualQuestion:   (cb)   => { ipcRenderer.on('manual:question', (_e, data) => cb(data)) },

  // ── Ctrl+Shift+E → send current question to AI ────────────────────────────
  onSendQuestion: (cb) => { ipcRenderer.on('overlay:send-question', () => cb()) },

  // ── Ctrl+Shift+S → screenshot captured, auto-send to AI ───────────────────
  onScreenshotAndSend: (cb) => { ipcRenderer.on('overlay:screenshot-send', (_e, dataUrl) => cb(dataUrl)) },

  // ── Screenshot (add to state only, no auto-send) ──────────────────────────
  captureScreen: () => ipcRenderer.invoke('screen:capture'),
  onScreenshot:  (cb) => { ipcRenderer.on('overlay:screenshot', (_e, dataUrl) => cb(dataUrl)) },

  // ── Session stop ───────────────────────────────────────────────────────────
  stopSession:    () => ipcRenderer.send('overlay:stop-session'),
  onStopSession:  (cb) => { ipcRenderer.on('session:stop', () => cb()) },

  // ── Overlay commands from global shortcuts ─────────────────────────────────
  onFontSize:   (cb) => { ipcRenderer.on('overlay:font-size',   (_e, dir) => cb(dir)) },
  onScroll:     (cb) => { ipcRenderer.on('overlay:scroll',      (_e, dir) => cb(dir)) },
  onFocusInput: (cb) => { ipcRenderer.on('overlay:focus-input', ()        => cb()) },
  onClearInput: (cb) => { ipcRenderer.on('overlay:clear-input', ()        => cb()) },

  // ── Windows Speech Recognition ─────────────────────────────────────────────
  startSpeechRecognition: () => ipcRenderer.send('speech:start'),
  stopSpeechRecognition:  () => ipcRenderer.send('speech:stop'),
  onSpeechReady:   (cb) => { ipcRenderer.on('speech:ready',   ()           => cb()) },
  onSpeechInterim: (cb) => { ipcRenderer.on('speech:interim', (_e, text)   => cb(text)) },
  onSpeechFinal:   (cb) => { ipcRenderer.on('speech:final',   (_e, text)   => cb(text)) },
  onSpeechError:   (cb) => { ipcRenderer.on('speech:error',   (_e, msg)    => cb(msg)) },

  removeAllListeners: (channel) => { ipcRenderer.removeAllListeners(channel) },
})
