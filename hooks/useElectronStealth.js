// Main-process stealth APIs for Interview Assistant
// Abstracts IPC for AI chat, screenshots, settings

import { useCallback, useEffect } from 'react'

export function useElectronStealth() {
  const api = (typeof window !== 'undefined' ? window.electronAPI : null)

  // AI Chat (main-process proxy → streaming)
  const chatAi = useCallback(async (params) => {
    if (!api) throw new Error('Electron API not available')
    return api.chatAi(params)
  }, [api])

  const useAiStream = (onChunk, onDone, onError, onMode) => {
    useEffect(() => {
      if (!api) return
      const offChunk = api.onAiChunk(onChunk)
      const offDone = api.onAiDone(onDone)
      const offError = api.onAiError(onError)
      const offMode = api.onAiMode ? api.onAiMode(onMode) : null
      return () => {
        offChunk()
        offDone()
        offError()
        if (offMode) offMode()
      }
    }, [api, onChunk, onDone, onError, onMode])
  }

  // Stealth Screenshot (hides window during capture)
  const captureStealthScreenshot = useCallback(async () => {
    if (!api) throw new Error('Electron API not available')
    return api.captureScreenshotStealth()
  }, [api])

  // Whisper STT Fallback (4s chunks)
  const transcribeWhisper = useCallback(async (audioBlob) => {
    if (!api) throw new Error('Electron API not available')
    return api.transcribeWhisper(audioBlob)
  }, [api])

  const useSttStream = (onResult, onError) => {
    useEffect(() => {
      if (!api) return
      const offResult = api.onSttResult(onResult)
      const offError = api.onSttError(onError)
      return () => {
        offResult()
        offError()
      }
    }, [api, onResult, onError])
  }

  // Settings
  const getSettings = useCallback(async () => {
    if (!api) return {}
    return api.getSettings()
  }, [api])

  const setSetting = useCallback(async (key, value) => {
    if (!api) return
    return api.setSetting(key, value)
  }, [api])

  const useSettings = (initial = {}) => {
    useEffect(() => {
      if (!api) return
      api.onSettingsInit((settings) => {
        Object.entries(settings).forEach(([k, v]) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(`stealth:${k}`, JSON.stringify(v))
          }
        })
      })
    }, [api])
    return {
      getSettings,
      setSetting,
      opacity: parseFloat(localStorage.getItem('stealth:opacity') || '0.95'),
      fontSize: parseInt(localStorage.getItem('stealth:fontSize') || '13'),
      sttProvider: localStorage.getItem('stealth:sttProvider') || 'windows',
      model: localStorage.getItem('stealth:model') || 'llama-3.3-70b-versatile'
    }
  }

  return {
    chatAi,
    useAiStream,
    captureStealthScreenshot,
    transcribeWhisper,
    useSttStream,
    getSettings,
    setSetting,
    useSettings
  }
}

