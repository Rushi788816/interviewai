const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── New Stealth APIs ──────────────────────────────────────────────────────
  // Main-process AI chat (streams chunks)
  chatAi: (params) => ipcRenderer.invoke('ai:chat', params),
  onAiChunk: (cb) => ipcRenderer.on('ai:chunk', (_e, token) => cb(token)),
  onAiDone: (cb) => ipcRenderer.on('ai:done', (_e, data) => cb(data)),
  onAiError: (cb) => ipcRenderer.on('ai:error', (_e, msg) => cb(msg)),
  onAiMode: (cb) => ipcRenderer.on('ai:mode', (_e, mode) => cb(mode)),

  // Whisper STT fallback
  transcribeWhisper: (audioBlob) => ipcRenderer.invoke('stt:whisper', audioBlob),
  onSttResult: (cb) => ipcRenderer.on('stt:result', (_e, text) => cb(text)),
  onSttError: (cb) => ipcRenderer.on('stt:error', (_e, msg) => cb(msg)),

  // Stealth screenshot (hides window during capture)
  captureScreenshotStealth: () => ipcRenderer.invoke('screenshot:stealth-capture'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  onSettingsInit: (cb) => ipcRenderer.on('settings:init', (_e, settings) => cb(settings)),

  // ── Existing APIs (kept for compatibility) ────────────────────────────────
  // Overlay lifecycle (no-ops)
  createOverlay:  () => { /* no-op */ },
  destroyOverlay: () => { /* no-op */ },

  // Mic permission
  checkMicPermission: () => ipcRenderer.invoke('mic:check-permission'),

  // Legacy data forwarding
  sendAnswer:   (data)   => ipcRenderer.send('overlay:set-answer', data),
  sendQuestion: (text)   => ipcRenderer.send('overlay:set-question', { text }),
  setStatus:    (status) => ipcRenderer.send('overlay:set-status', status),
  clearOverlay: ()       => ipcRenderer.send('overlay:clear'),

  // Window controls
  toggleOverlay:  () => ipcRenderer.send('overlay:toggle'),
  showOverlay:    () => ipcRenderer.send('overlay:show'),
  hideOverlay:    () => ipcRenderer.send('overlay:hide'),
  setOpacity:     (value) => ipcRenderer.send('overlay:set-opacity', value),
  hideMainWindow: () => ipcRenderer.send('main:hide'),
  showMainWindow: () => ipcRenderer.send('main:show'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  hideWindow:     () => ipcRenderer.send('window:hide'),
  closeWindow:    () => ipcRenderer.send('window:close'),

  // Position
  moveWindow: (dir) => ipcRenderer.send('overlay:move-window', dir),

  // Mode
  setModeFromOverlay: (data) => ipcRenderer.send('overlay:set-mode', data),
  onModeSet: (cb) => ipcRenderer.on('mode:set', (_e, data) => cb(data)),
  onModeConfirmed: (cb) => ipcRenderer.on('mode:confirmed', (_e, data) => cb(data)),

  // Mic
  toggleMicFromOverlay: () => ipcRenderer.send('overlay:mic-toggle'),
  getMicState: () => ipcRenderer.invoke('overlay:get-mic-state'),
  onMicState: (cb) => ipcRenderer.on('mic:state', (_e, state) => cb(state)),

  // Listeners
  onAnswer: (cb) => ipcRenderer.on('overlay:answer', (_e, data) => cb(data)),
  onQuestion: (cb) => ipcRenderer.on('overlay:question', (_e, data) => cb(data)),
  onStatus: (cb) => ipcRenderer.on('overlay:status', (_e, status) => cb(status)),
  onClear: (cb) => ipcRenderer.on('overlay:clear', () => cb()),
  onCopyAnswer: (cb) => ipcRenderer.on('overlay:copy-answer', () => cb()),

  // Manual question
  sendManualQuestion: (data) => ipcRenderer.send('overlay:manual-question', data),
  onManualQuestion: (cb) => ipcRenderer.on('manual:question', (_e, data) => cb(data)),

  // Shortcuts
  onSendQuestion: (cb) => ipcRenderer.on('overlay:send-question', () => cb()),
  onScreenshotAndSend: (cb) => ipcRenderer.on('overlay:screenshot-send', (_e, dataUrl) => cb(dataUrl)),
  captureScreen: () => ipcRenderer.invoke('screen:capture'), // Legacy
  onScreenshot: (cb) => ipcRenderer.on('overlay:screenshot', (_e, dataUrl) => cb(dataUrl)),

  // Session
  stopSession: () => ipcRenderer.send('overlay:stop-session'),
  onStopSession: (cb) => ipcRenderer.on('session:stop', () => cb()),

  // Overlay commands
  onFontSize: (cb) => ipcRenderer.on('overlay:font-size', (_e, dir) => cb(dir)),
  onScroll: (cb) => ipcRenderer.on('overlay:scroll', (_e, dir) => cb(dir)),
  onFocusInput: (cb) => ipcRenderer.on('overlay:focus-input', () => cb()),
  onClearInput: (cb) => ipcRenderer.on('overlay:clear-input', () => cb()),

  // Speech Recognition
  startSpeechRecognition: () => ipcRenderer.send('speech:start'),
  stopSpeechRecognition: () => ipcRenderer.send('speech:stop'),
  onSpeechReady: (cb) => ipcRenderer.on('speech:ready', () => cb()),
  onSpeechInterim: (cb) => ipcRenderer.on('speech:interim', (_e, text) => cb(text)),
  onSpeechFinal: (cb) => ipcRenderer.on('speech:final', (_e, text) => cb(text)),
  onSpeechError: (cb) => ipcRenderer.on('speech:error', (_e, msg) => cb(msg)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Auth
  onSignOut: (cb) => ipcRenderer.on('auth:signout', () => cb()),

  appPlatform: () => ipcRenderer.invoke('app:platform'),
})
