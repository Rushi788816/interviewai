const Store = require('electron-store')

const store = new Store({
  defaults: {
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    opacity: 0.95,
    fontSize: 13,
    sttProvider: 'windows'  // 'windows' | 'whisper'
  }
})

module.exports = store
