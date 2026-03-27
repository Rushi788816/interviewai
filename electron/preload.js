const { contextBridge, ipcRenderer } = require('electron')

/**
 * Exposes a safe IPC bridge to the renderer (Next.js app and overlay).
 * contextBridge ensures the renderer cannot access Node.js APIs directly.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Detection ──────────────────────────────────────────────────────────────
  isElectron: true,

  // ── From main app → overlay ────────────────────────────────────────────────
  // Send an AI answer chunk (streaming) to the overlay
  sendAnswer: (data) => ipcRenderer.send('overlay:set-answer', data),

  // Send the detected question text to the overlay
  sendQuestion: (text) => ipcRenderer.send('overlay:set-question', { text }),

  // Update the overlay status badge
  // status: 'idle' | 'listening' | 'thinking' | 'ready'
  setStatus: (status) => ipcRenderer.send('overlay:set-status', status),

  // Clear the overlay content
  clearOverlay: () => ipcRenderer.send('overlay:clear'),

  // ── Overlay visibility ─────────────────────────────────────────────────────
  toggleOverlay: () => ipcRenderer.send('overlay:toggle'),
  showOverlay: () => ipcRenderer.send('overlay:show'),
  hideOverlay: () => ipcRenderer.send('overlay:hide'),

  // ── From overlay → control itself ─────────────────────────────────────────
  // Set window opacity (0.0 – 1.0)
  setOpacity: (value) => ipcRenderer.send('overlay:set-opacity', value),

  // ── Listeners (for overlay window to receive data) ────────────────────────
  onAnswer: (cb) => {
    ipcRenderer.on('overlay:answer', (_e, data) => cb(data))
  },
  onQuestion: (cb) => {
    ipcRenderer.on('overlay:question', (_e, data) => cb(data))
  },
  onStatus: (cb) => {
    ipcRenderer.on('overlay:status', (_e, status) => cb(status))
  },
  onClear: (cb) => {
    ipcRenderer.on('overlay:clear', () => cb())
  },
  onCopyAnswer: (cb) => {
    ipcRenderer.on('overlay:copy-answer', () => cb())
  },

  // ── Cleanup ────────────────────────────────────────────────────────────────
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
