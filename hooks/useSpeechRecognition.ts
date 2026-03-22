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
  const finalTranscriptRef = useRef("")
  const onSilenceRef = useRef(onSilence)
  const isListeningRef = useRef(false)

  useEffect(() => {
    onSilenceRef.current = onSilence
  }, [onSilence])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback((text: string) => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const textToSend = text.trim()
      console.log("Silence timer fired, sending:", textToSend)
      if (textToSend && onSilenceRef.current) {
        onSilenceRef.current({ finalTranscript: textToSend })
        finalTranscriptRef.current = ""
        setTranscript("")
      }
    }, 1500)
  }, [clearSilenceTimer])

  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Use Chrome.")
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = isDesiMode ? "en-IN" : language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log("Speech recognition started")
      setIsListening(true)
      isListeningRef.current = true
      setError(null)
    }

    recognition.onend = () => {
      console.log("Speech recognition ended, isListening:", isListeningRef.current)
      if (isListeningRef.current) {
        // Auto restart if we want to keep listening
        try {
          recognition.start()
        } catch (e) {
          console.log("Restart failed:", e)
          setIsListening(false)
          isListeningRef.current = false
        }
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      if (event.error === "no-speech") return
      if (event.error === "aborted") return
      setError(`Mic error: ${event.error}`)
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let finalChunk = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalChunk += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (finalChunk) {
        finalTranscriptRef.current += finalChunk + " "
        setTranscript(finalTranscriptRef.current.trim())
        console.log("Speech detected, starting silence timer. Final so far:", finalTranscriptRef.current)
        startSilenceTimer(finalTranscriptRef.current)
      }

      setInterimTranscript(interim)
    }

    return recognition
  }, [language, isDesiMode, startSilenceTimer])

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      // Stop listening
      console.log("Stopping speech recognition")
      isListeningRef.current = false
      setIsListening(false)
      clearSilenceTimer()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log("Stop error:", e)
        }
      }
    } else {
      // Start listening
      console.log("Starting speech recognition")
      finalTranscriptRef.current = ""
      setTranscript("")
      setInterimTranscript("")

      const recognition = initRecognition()
      if (!recognition) return

      recognitionRef.current = recognition
      isListeningRef.current = true

      try {
        recognition.start()
      } catch (e) {
        console.error("Failed to start recognition:", e)
        setError("Failed to start microphone")
        isListeningRef.current = false
        setIsListening(false)
      }
    }
  }, [initRecognition, clearSilenceTimer])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ""
    setTranscript("")
    setInterimTranscript("")
    clearSilenceTimer()
  }, [clearSilenceTimer])

  // Update language when it changes
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [clearSilenceTimer])

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
