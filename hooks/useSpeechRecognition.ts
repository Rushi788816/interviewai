'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Minimal typings — DOM lib may omit Web Speech API in some TS setups */
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorLike) => void) | null
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: {
    length: number
    [i: number]: {
      isFinal: boolean
      [j: number]: { transcript: string }
    }
  }
}

interface SpeechRecognitionErrorLike extends Event {
  error: string
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionOptions {
  language: string
  /** When true, recognition uses en-IN (Indian English) for better accent handling */
  isDesiMode?: boolean
  onSilence?: (finalText: string) => void
}

export interface SpeechRecognitionHook {
  transcript: string
  interimTranscript: string
  isListening: boolean
  error: string | null
  start: () => void
  stop: () => void
  resetTranscript: () => void
  toggleListening: () => void
  setLanguage: (lang: string) => void
  language: string
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions): SpeechRecognitionHook {
  const { language, isDesiMode = false, onSilence } = options
  const onSilenceRef = useRef(onSilence)
  onSilenceRef.current = onSilence

  const effectiveLang = isDesiMode ? 'en-IN' : language

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [langState, setLangState] = useState(effectiveLang)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedRef = useRef('')
  const listeningIntentRef = useRef(false)
  const langRef = useRef(effectiveLang)
  const prevEffectiveLangRef = useRef<string | null>(null)

  useEffect(() => {
    langRef.current = effectiveLang
    setLangState(effectiveLang)
  }, [effectiveLang])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const destroyRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* noop */
      }
      recognitionRef.current = null
    }
  }, [])

  const bindRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError('Speech Recognition not supported in this browser')
      return null
    }

    destroyRecognition()

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = langRef.current

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          accumulatedRef.current += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(accumulatedRef.current.trim())
      setInterimTranscript(interim)

      clearSilenceTimer()
      console.log('Speech detected, starting silence timer. Final so far:', accumulatedRef.current)

      silenceTimerRef.current = setTimeout(() => {
        const textToSend = accumulatedRef.current.trim()
        console.log('Silence timer fired, calling onSilence with:', textToSend)
        if (textToSend && onSilenceRef.current) {
          onSilenceRef.current(textToSend)
          accumulatedRef.current = ''
          setTranscript('')
          setInterimTranscript('')
        }
        silenceTimerRef.current = null
      }, 1500)
    }

    recognition.onerror = (event: SpeechRecognitionErrorLike) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(event.error)
    }

    recognition.onend = () => {
      if (listeningIntentRef.current) {
        try {
          recognition.start()
        } catch {
          setIsListening(false)
          listeningIntentRef.current = false
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
    return recognition
  }, [destroyRecognition, clearSilenceTimer])

  /** When language / Desi mode changes while mic is active, restart recognition so `lang` applies */
  useEffect(() => {
    if (prevEffectiveLangRef.current === null) {
      prevEffectiveLangRef.current = effectiveLang
      return
    }
    if (prevEffectiveLangRef.current === effectiveLang) return
    prevEffectiveLangRef.current = effectiveLang

    if (!listeningIntentRef.current) return

    const wasListening = listeningIntentRef.current
    clearSilenceTimer()
    listeningIntentRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      /* noop */
    }
    destroyRecognition()

    listeningIntentRef.current = wasListening
    const recognition = bindRecognition()
    if (recognition && wasListening) {
      try {
        recognition.start()
        setIsListening(true)
      } catch {
        setError('Could not restart microphone with new language')
        listeningIntentRef.current = false
        setIsListening(false)
      }
    }
  }, [effectiveLang, bindRecognition, clearSilenceTimer, destroyRecognition])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError('Speech Recognition not supported in this browser')
      return
    }
    listeningIntentRef.current = true
    const recognition = bindRecognition()
    if (!recognition) return
    try {
      recognition.start()
      setIsListening(true)
      setError(null)
    } catch {
      setError('Could not start microphone')
      listeningIntentRef.current = false
      setIsListening(false)
    }
  }, [bindRecognition])

  const stop = useCallback(() => {
    listeningIntentRef.current = false
    clearSilenceTimer()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* noop */
      }
    }
    setIsListening(false)
  }, [clearSilenceTimer])

  const toggleListening = useCallback(() => {
    if (listeningIntentRef.current) stop()
    else start()
  }, [start, stop])

  const resetTranscript = useCallback(() => {
    accumulatedRef.current = ''
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const setLanguage = useCallback(
    (lang: string) => {
      const next = isDesiMode ? 'en-IN' : lang
      langRef.current = next
      setLangState(next)
    },
    [isDesiMode]
  )

  useEffect(() => {
    return () => {
      clearSilenceTimer()
      listeningIntentRef.current = false
      destroyRecognition()
    }
  }, [clearSilenceTimer, destroyRecognition])

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    start,
    stop,
    resetTranscript,
    toggleListening,
    setLanguage,
    language: langState,
  }
}
