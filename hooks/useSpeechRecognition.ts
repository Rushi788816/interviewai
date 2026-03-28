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
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const delay = wordCount <= 2 ? 2000 : wordCount <= 5 ? 1500 : 1200

    silenceTimerRef.current = setTimeout(() => {
      const textToSend = finalTranscriptRef.current.trim()
      const words = textToSend.split(/\s+/).filter(Boolean)
      console.log(`[STT] silence detected text="${textToSend}" wordCount=${words.length}`)

      if (words.length < 3) {
        console.log("[STT] too few words, extending wait 1500ms")
        silenceTimerRef.current = setTimeout(() => {
          const retryText = finalTranscriptRef.current.trim()
          console.log(`[STT] extended wait done text="${retryText}"`)
          if (retryText.split(/\s+/).filter(Boolean).length >= 1 && onSilenceRef.current) {
            console.log("[STT] firing onSilence after extended wait")
            onSilenceRef.current({ finalTranscript: retryText })
            finalTranscriptRef.current = ""
            setTranscript("")
          }
        }, 1500)
        return
      }

      console.log("[STT] firing onSilence")
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
    if (usingWindowsSRRef.current) {
      ;(window as any).electronAPI?.stopSpeechRecognition?.()
      usingWindowsSRRef.current = false
    }
  }, [clearSilenceTimer, clearRestartTimer])

  // Each call records 3 seconds then restarts — every cycle is a complete valid WebM file
  const runCycleRef = useRef<(() => void) | null>(null)

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
      console.log(`[STT] cycle blob.size=${blob.size}`)

      if (blob.size > 2000) {
        try {
          const ext = mimeType.includes("webm") ? "webm" : "ogg"
          const formData = new FormData()
          formData.append("audio", new File([blob], `chunk.${ext}`, { type: mimeType || "audio/webm" }))
          console.log("[STT] sending to /api/ai/transcribe...")
          const t0 = Date.now()
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData })
          console.log(`[STT] status=${res.status} in ${Date.now() - t0}ms`)
          if (res.ok && isListeningRef.current) {
            const { text, error: apiErr } = await res.json()
            console.log(`[STT] text="${text}" err=${apiErr ?? "none"}`)
            if (text?.trim()) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + text.trim()
              console.log(`[STT] accumulated="${finalTranscriptRef.current}"`)
              setTranscript(finalTranscriptRef.current)
              startSilenceTimer(finalTranscriptRef.current)
            }
          }
        } catch (err: any) {
          console.error("[STT] transcription error:", err?.message)
        }
      }

      // Restart cycle immediately
      if (isListeningRef.current) runCycleRef.current?.()
    }

    recorder.start()
    console.log("[STT] recording cycle started (3s)")

    // Stop after 3 seconds → triggers onstop → transcribe → restart
    cycleTimeoutRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop()
    }, 3000)
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

  // ── Browser path: Web Speech API ──────────────────────────────────────────
  const buildAndStartRecognition = useCallback(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome.")
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
      restartTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return
        buildAndStartRef.current()
      }, 300)
    }

    rec.onerror = (event: any) => {
      const { error: errCode } = event
      if (errCode === "no-speech" || errCode === "aborted") return
      console.error("Fatal recognition error:", errCode)
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
  }, [startSilenceTimer, clearRestartTimer])

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
      if (inElectron()) {
        stopElectronRecognition()
      } else {
        if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
      }
    } else {
      const now = Date.now()
      if (now - lastStartRef.current < 500) return
      lastStartRef.current = now
      finalTranscriptRef.current = ""
      setTranscript("")
      setInterimTranscript("")
      isListeningRef.current = true
      if (inElectron()) {
        startElectronRecognition()
      } else {
        buildAndStartRef.current()
      }
    }
  }, [clearSilenceTimer, clearRestartTimer, stopElectronRecognition, startElectronRecognition])

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
      if (inElectron()) {
        if (usingWindowsSRRef.current) {
          ;(window as any).electronAPI?.stopSpeechRecognition?.()
          ;(window as any).electronAPI?.removeAllListeners?.('speech:ready')
          ;(window as any).electronAPI?.removeAllListeners?.('speech:interim')
          ;(window as any).electronAPI?.removeAllListeners?.('speech:final')
          ;(window as any).electronAPI?.removeAllListeners?.('speech:error')
          usingWindowsSRRef.current = false
          srListenersAttachedRef.current = false
        }
        if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop() } catch {} }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()) }
      } else {
        if (recognitionRef.current) { try { recognitionRef.current.onend = null; recognitionRef.current.stop() } catch {} }
      }
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
