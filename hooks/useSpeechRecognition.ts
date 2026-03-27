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

export function useSpeechRecognition({
  language = "en-US",
  isDesiMode = false,
  onSilence,
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef("")
  const onSilenceRef = useRef(onSilence)
  const isListeningRef = useRef(false)
  const languageRef = useRef(isDesiMode ? "en-IN" : language)

  // Always keep refs up to date
  useEffect(() => { onSilenceRef.current = onSilence }, [onSilence])
  useEffect(() => { languageRef.current = isDesiMode ? "en-IN" : language }, [language, isDesiMode])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback((text: string) => {
    clearSilenceTimer()

    // Adaptive delay: fewer words = longer wait (user still forming the sentence)
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const delay = wordCount <= 2 ? 4000 : wordCount <= 5 ? 3000 : 2200

    silenceTimerRef.current = setTimeout(() => {
      const textToSend = finalTranscriptRef.current.trim()
      const words = textToSend.split(/\s+/).filter(Boolean)

      // Need at least 4 words — avoids sending noise, stray words, half-phrases
      if (words.length < 4) {
        // Extend the wait one more time before giving up
        silenceTimerRef.current = setTimeout(() => {
          const retryText = finalTranscriptRef.current.trim()
          if (retryText.split(/\s+/).filter(Boolean).length >= 2 && onSilenceRef.current) {
            console.log("Sending after extended wait:", retryText)
            onSilenceRef.current({ finalTranscript: retryText })
            finalTranscriptRef.current = ""
            setTranscript("")
          }
        }, 3000)
        return
      }

      console.log("Silence detected, sending:", textToSend)
      if (onSilenceRef.current) {
        onSilenceRef.current({ finalTranscript: textToSend })
        finalTranscriptRef.current = ""
        setTranscript("")
      }
    }, delay)
  }, [clearSilenceTimer])

  // ── Core: build a fresh SpeechRecognition instance ──────────────────────────
  // Stored in a ref so onend/onerror closures always call the latest version
  const buildAndStartRecognition = useCallback(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome.")
      return
    }

    // Tear down previous instance cleanly before creating new one
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = languageRef.current
    rec.maxAlternatives = 1

    rec.onstart = () => {
      console.log("Recognition started")
      setIsListening(true)
      isListeningRef.current = true
      setError(null)
    }

    rec.onend = () => {
      console.log("Recognition ended")
      clearRestartTimer()

      if (!isListeningRef.current) {
        // Intentional stop — update state and quit
        setIsListening(false)
        return
      }

      // Unintentional end (browser timeout, tab switch, pause too long) — restart
      console.log("Unintentional end, restarting in 300ms…")
      restartTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return // Was stopped while waiting
        console.log("Restarting recognition with fresh instance")
        buildAndStartRecognition()
      }, 300)
    }

    rec.onerror = (event: any) => {
      const { error: errCode } = event
      console.warn("Recognition error:", errCode)

      // These are non-fatal — browser will fire onend, which handles restart
      if (errCode === "no-speech" || errCode === "aborted") return

      // Fatal errors
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

    try {
      rec.start()
    } catch (e) {
      console.error("Failed to start recognition:", e)
      setError("Failed to access microphone")
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [startSilenceTimer, clearRestartTimer])

  // Keep buildAndStartRecognition in a ref so onend closures always have latest version
  const buildAndStartRef = useRef(buildAndStartRecognition)
  useEffect(() => { buildAndStartRef.current = buildAndStartRecognition }, [buildAndStartRecognition])

  // ── Public toggle ────────────────────────────────────────────────────────────
  const lastStartRef = useRef(0)

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      // ── STOP ──
      console.log("Stopping recognition")
      isListeningRef.current = false
      setIsListening(false)
      clearSilenceTimer()
      clearRestartTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    } else {
      // ── START ──
      const now = Date.now()
      if (now - lastStartRef.current < 500) return // debounce
      lastStartRef.current = now

      finalTranscriptRef.current = ""
      setTranscript("")
      setInterimTranscript("")
      isListeningRef.current = true // set before build so onend knows

      buildAndStartRef.current()
    }
  }, [clearSilenceTimer, clearRestartTimer])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ""
    setTranscript("")
    setInterimTranscript("")
    clearSilenceTimer()
  }, [clearSilenceTimer])

  // Update language on the active recognition without restarting
  useEffect(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.lang = isDesiMode ? "en-IN" : language
    }
  }, [language, isDesiMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      clearSilenceTimer()
      clearRestartTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.stop() } catch {}
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
