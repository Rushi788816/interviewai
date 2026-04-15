"use client"
import { useEffect, useRef, useState, useCallback } from "react"

interface UseSpeechRecognitionProps {
  language?: string
  isDesiMode?: boolean
  onSilence?: (params: { finalTranscript: string }) => void
}

interface UseSpeechRecognitionReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  error: string | null
  resetTranscript: () => void
  toggleListening: () => void
  language: string
}

const inElectron = () =>
  typeof window !== "undefined" && !!(window as any).electronAPI?.isElectron

export function useSpeechRecognition({
  language = "en-US",
  isDesiMode = false,
  onSilence,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Web Speech API ref
  const recognitionRef = useRef<any>(null)

  // Electron MediaRecorder refs
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mimeTypeRef = useRef("")

  // Shared refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef("")
  const onSilenceRef = useRef(onSilence)
  const isListeningRef = useRef(false)
  const languageRef = useRef(isDesiMode ? "en-IN" : language)

  useEffect(() => { onSilenceRef.current = onSilence }, [onSilence])
  useEffect(() => { languageRef.current = isDesiMode ? "en-IN" : language }, [language, isDesiMode])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
  }, [])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
  }, [])

  const startSilenceTimer = useCallback((text: string) => {
    clearSilenceTimer()
    // Always wait at least 2s — interviewers pause mid-sentence frequently
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const delay = wordCount <= 3 ? 3500 : wordCount <= 8 ? 3000 : 2500

    silenceTimerRef.current = setTimeout(() => {
      const textToSend = finalTranscriptRef.current.trim()
      const words = textToSend.split(/\s+/).filter(Boolean)

      if (words.length < 3) {
        // Still short — wait one more second before firing
        silenceTimerRef.current = setTimeout(() => {
          const retryText = finalTranscriptRef.current.trim()
          if (retryText.split(/\s+/).filter(Boolean).length >= 1 && onSilenceRef.current) {
            onSilenceRef.current({ finalTranscript: retryText })
            finalTranscriptRef.current = ""
            setTranscript("")
          }
        }, 1000)
        return
      }

      if (onSilenceRef.current) {
        onSilenceRef.current({ finalTranscript: textToSend })
        finalTranscriptRef.current = ""
        setTranscript("")
      }
    }, delay)
  }, [clearSilenceTimer])

  // ── Electron path: Windows SR (primary) + MediaRecorder fallback ──────────
  const srListenersAttachedRef = useRef(false)
  const usingWindowsSRRef = useRef(false)

  const stopElectronRecognition = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    clearSilenceTimer()
    clearRestartTimer()
    if (cycleTimeoutRef.current) { clearTimeout(cycleTimeoutRef.current); cycleTimeoutRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    mediaRecorderRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    // Always stop Windows SR and clean up IPC listeners so next start is fresh
    const api = (window as any).electronAPI
    api?.stopSpeechRecognition?.()
    api?.removeAllListeners?.('speech:ready')
    api?.removeAllListeners?.('speech:interim')
    api?.removeAllListeners?.('speech:final')
    api?.removeAllListeners?.('speech:error')
    usingWindowsSRRef.current = false
    srListenersAttachedRef.current = false  // reset so next toggle re-registers properly
  }, [clearSilenceTimer, clearRestartTimer])

  // Records 5-second chunks — longer windows capture full sentences without splits.
  // Passes prior transcript as Whisper prompt for context continuity across chunks.
  // Skips silent chunks using Web Audio amplitude check (VAD) to save API calls.
  const runCycleRef = useRef<(() => void) | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const runRecordingCycle = useCallback(() => {
    const stream = mediaStreamRef.current
    const mimeType = mimeTypeRef.current
    if (!stream || !isListeningRef.current) return

    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.onstop = async () => {
      if (!isListeningRef.current) return

      const blob = new Blob(chunks, { type: mimeType || "audio/webm" })

      // Amplitude VAD — check if chunk has actual speech before calling API
      // Skip chunks that are pure silence (saves Groq quota + avoids noise triggers)
      const isSpeech = await (async () => {
        try {
          const arr = await blob.arrayBuffer()
          const ctx = new AudioContext()
          const buf = await ctx.decodeAudioData(arr)
          const data = buf.getChannelData(0)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += Math.abs(data[i])
          ctx.close()
          return (sum / data.length) > 0.005  // RMS threshold — below this is background noise
        } catch { return blob.size > 5000 }   // fallback: trust size if decode fails
      })()

      if (isSpeech && blob.size > 3000) {
        // Person is still talking — cancel any pending silence timer so we don't send mid-speech
        clearSilenceTimer()
        try {
          const ext = mimeType.includes("webm") ? "webm" : "ogg"
          const formData = new FormData()
          formData.append("audio", new File([blob], `chunk.${ext}`, { type: mimeType || "audio/webm" }))
          if (finalTranscriptRef.current.trim()) {
            formData.append("prompt", finalTranscriptRef.current.trim())
          }
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData })
          if (res.ok && isListeningRef.current) {
            const { text } = await res.json()
            if (text?.trim()) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + text.trim()
              setTranscript(finalTranscriptRef.current)
              // Still don't start silence timer yet — wait for a silent chunk to confirm they stopped
            }
          }
        } catch (err: any) {
          console.error("[STT] transcription error:", err?.message)
        }
      } else {
        // No speech in this chunk — person has paused/stopped, now start the silence timer
        if (finalTranscriptRef.current.trim()) {
          startSilenceTimer(finalTranscriptRef.current)
        }
      }

      if (isListeningRef.current) runCycleRef.current?.()
    }

    recorder.start()

    // 5-second chunks — long enough to capture full questions, short enough to feel responsive
    cycleTimeoutRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop()
    }, 5000)
  }, [startSilenceTimer])

  useEffect(() => { runCycleRef.current = runRecordingCycle }, [runRecordingCycle])

  const startGroqFallback = useCallback(async () => {
    console.log("[STT] Starting Groq Whisper fallback (MediaRecorder cycle)")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(m =>
          MediaRecorder.isTypeSupported(m)
        ) ?? ""
      mimeTypeRef.current = mimeType

      console.log(`[STT] Groq fallback mimeType="${mimeType}"`)
      runRecordingCycle()
    } catch (err: any) {
      console.error("[STT] mic error:", err?.message)
      setError("Failed to access microphone")
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [runRecordingCycle])

  const startElectronRecognition = useCallback(async () => {
    const api = (window as any).electronAPI
    isListeningRef.current = true
    setIsListening(true)
    setError(null)

    // Try Windows Speech Recognition first
    if (api?.startSpeechRecognition && !srListenersAttachedRef.current) {
      srListenersAttachedRef.current = true

      let srReadyReceived = false
      const srReadyTimeout = setTimeout(() => {
        if (!srReadyReceived && isListeningRef.current) {
          console.warn("[STT] Windows SR not ready after 4s — falling back to Groq Whisper")
          usingWindowsSRRef.current = false
          startGroqFallback()
        }
      }, 4000)

      api.onSpeechReady?.(() => {
        clearTimeout(srReadyTimeout)
        srReadyReceived = true
        console.log("[STT] Windows SR ready")
      })

      api.onSpeechInterim?.((text: string) => {
        if (!isListeningRef.current) return
        setInterimTranscript(text)
      })

      api.onSpeechFinal?.((text: string) => {
        if (!isListeningRef.current || !text.trim()) return
        clearTimeout(srReadyTimeout)
        finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + text.trim()
        console.log(`[STT] Windows SR final="${text.trim()}" accumulated="${finalTranscriptRef.current}"`)
        setTranscript(finalTranscriptRef.current)
        setInterimTranscript("")
        startSilenceTimer(finalTranscriptRef.current)
      })

      api.onSpeechError?.((msg: string) => {
        console.error("[STT] Windows SR error:", msg)
        if (!srReadyReceived && isListeningRef.current) {
          clearTimeout(srReadyTimeout)
          console.warn("[STT] Windows SR error — falling back to Groq Whisper")
          usingWindowsSRRef.current = false
          startGroqFallback()
        }
      })

      usingWindowsSRRef.current = true
      console.log("[STT] Starting Windows Speech Recognition")
      api.startSpeechRecognition()
    } else {
      // No Windows SR API — use Groq Whisper directly
      console.log("[STT] No Windows SR API available, using Groq Whisper")
      await startGroqFallback()
    }
  }, [startGroqFallback, startSilenceTimer])

  // Whether we already fell back to Groq (avoid double-fallback)
  const usingGroqFallbackRef = useRef(false)

  // ── Browser path: Web Speech API with Groq fallback on network error ──────
  const buildAndStartRecognition = useCallback(() => {
    if (typeof window === "undefined") return

    // If already using Groq (e.g. after a network error fallback), don't restart Web Speech
    if (usingGroqFallbackRef.current) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // No Web Speech API at all — go straight to Groq Whisper
      console.warn("[STT] No Web Speech API — using Groq Whisper")
      usingGroqFallbackRef.current = true
      void startGroqFallback()
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = languageRef.current
    rec.maxAlternatives = 1

    rec.onstart = () => { setIsListening(true); isListeningRef.current = true; setError(null) }

    rec.onend = () => {
      clearRestartTimer()
      if (!isListeningRef.current) { setIsListening(false); return }
      if (usingGroqFallbackRef.current) return  // Groq took over, don't restart Web Speech
      restartTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return
        buildAndStartRef.current()
      }, 300)
    }

    rec.onerror = (event: any) => {
      const { error: errCode } = event
      if (errCode === "no-speech" || errCode === "aborted") return
      console.error("[STT] Web Speech error:", errCode)
      if ((errCode === "network" || errCode === "service-not-allowed" || errCode === "not-allowed") && inElectron()) {
        // Google's speech servers unreachable in Electron — fall back to Groq Whisper
        console.warn("[STT] Network error in Electron — switching to Groq Whisper fallback")
        recognitionRef.current = null
        usingGroqFallbackRef.current = true
        setError(null)
        if (isListeningRef.current) void startGroqFallback()
        return
      }
      setError(`Microphone error: ${errCode}`)
      isListeningRef.current = false
      setIsListening(false)
    }

    rec.onresult = (event: any) => {
      let interim = ""
      let finalChunk = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalChunk += result[0].transcript
        else interim += result[0].transcript
      }
      if (finalChunk) {
        finalTranscriptRef.current += finalChunk + " "
        setTranscript(finalTranscriptRef.current.trim())
        startSilenceTimer(finalTranscriptRef.current)
      }
      setInterimTranscript(interim)
    }

    recognitionRef.current = rec
    try { rec.start() } catch {
      setError("Failed to access microphone")
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [startSilenceTimer, clearRestartTimer, startGroqFallback])

  const buildAndStartRef = useRef(buildAndStartRecognition)
  useEffect(() => { buildAndStartRef.current = buildAndStartRecognition }, [buildAndStartRecognition])

  // ── Public API ────────────────────────────────────────────────────────────
  const lastStartRef = useRef(0)

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      isListeningRef.current = false
      setIsListening(false)
      clearSilenceTimer()
      clearRestartTimer()
      // Clean up Electron IPC listeners if any were started
      stopElectronRecognition()
      usingGroqFallbackRef.current = false
      if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    } else {
      const now = Date.now()
      if (now - lastStartRef.current < 500) return
      lastStartRef.current = now
      finalTranscriptRef.current = ""
      setTranscript("")
      setInterimTranscript("")
      isListeningRef.current = true
        // Always start with Web Speech API; falls back to Groq on network error
      usingGroqFallbackRef.current = false
      buildAndStartRef.current()
    }
  }, [clearSilenceTimer, clearRestartTimer, stopElectronRecognition])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ""
    setTranscript("")
    setInterimTranscript("")
    clearSilenceTimer()
  }, [clearSilenceTimer])

  useEffect(() => {
    if (recognitionRef.current && isListeningRef.current && !inElectron()) {
      recognitionRef.current.lang = isDesiMode ? "en-IN" : language
    }
  }, [language, isDesiMode])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      clearSilenceTimer()
      clearRestartTimer()
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current)
      if (recognitionRef.current) { try { recognitionRef.current.onend = null; recognitionRef.current.stop() } catch {} }
      // Also clean up any Electron IPC listeners that may have been registered
      const api = (window as any).electronAPI
      if (api) {
        api.stopSpeechRecognition?.()
        api.removeAllListeners?.('speech:ready')
        api.removeAllListeners?.('speech:interim')
        api.removeAllListeners?.('speech:final')
        api.removeAllListeners?.('speech:error')
      }
      if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop() } catch {} }
      if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()) }
    }
  }, [clearSilenceTimer, clearRestartTimer])

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    resetTranscript,
    toggleListening,
    language: isDesiMode ? "en-IN" : language,
  }
}
