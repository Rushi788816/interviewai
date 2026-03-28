const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── Overlay lifecycle ──────────────────────────────────────────────────────
  // Call when interview session starts — creates & shows the overlay
  createOverlay: () => ipcRenderer.send('overlay:create'),
  // Call when interview session stops — destroys the overlay completely
  destroyOverlay: () => ipcRenderer.send('overlay:destroy'),

  // ── Mic permission ─────────────────────────────────────────────────────────
  // Returns 'granted' | 'denied' | 'error'
  checkMicPermission: () => ipcRenderer.invoke('mic:check-permission'),

  // ── Data → overlay ─────────────────────────────────────────────────────────
  sendAnswer: (data) => ipcRenderer.send('overlay:set-answer', data),
  sendQuestion: (text) => ipcRenderer.send('overlay:set-question', { text }),
  setStatus: (status) => ipcRenderer.send('overlay:set-status', status),
  clearOverlay: () => ipcRenderer.send('overlay:clear'),

  // ── Overlay visibility ─────────────────────────────────────────────────────
  toggleOverlay: () => ipcRenderer.send('overlay:toggle'),
  showOverlay: () => ipcRenderer.send('overlay:show'),
  hideOverlay: () => ipcRenderer.send('overlay:hide'),
  setOpacity: (value) => ipcRenderer.send('overlay:set-opacity', value),

  // ── Listeners (overlay window receives data from main app) ─────────────────
  onAnswer: (cb) => { ipcRenderer.on('overlay:answer', (_e, data) => cb(data)) },
  onQuestion: (cb) => { ipcRenderer.on('overlay:question', (_e, data) => cb(data)) },
  onStatus: (cb) => { ipcRenderer.on('overlay:status', (_e, status) => cb(status)) },
  onClear: (cb) => { ipcRenderer.on('overlay:clear', () => cb()) },
  onCopyAnswer: (cb) => { ipcRenderer.on('overlay:copy-answer', () => cb()) },

  removeAllListeners: (channel) => { ipcRenderer.removeAllListeners(channel) },

  // ── Windows Speech Recognition ─────────────────────────────────────────────
  startSpeechRecognition: () => ipcRenderer.send('speech:start'),
  stopSpeechRecognition: () => ipcRenderer.send('speech:stop'),
  onSpeechReady: (cb) => { ipcRenderer.on('speech:ready', () => cb()) },
  onSpeechInterim: (cb) => { ipcRenderer.on('speech:interim', (_e, text) => cb(text)) },
  onSpeechFinal: (cb) => { ipcRenderer.on('speech:final', (_e, text) => cb(text)) },
  onSpeechError: (cb) => { ipcRenderer.on('speech:error', (_e, msg) => cb(msg)) },
})
