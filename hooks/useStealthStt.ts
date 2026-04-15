import { useCallback, useEffect, useRef, useState } from 'react'
import { useElectronStealth } from './useElectronStealth'

export function useStealthStt({
  language = 'en-US',
  isDesiMode = false,
  onSilence
}: {
  language?: string
  isDesiMode?: boolean
  onSilence?: (params: { finalTranscript: string }) => void
}) {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { transcribeWhisper, useSttStream } = useElectronStealth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)
  const accumulatedRef = useRef('')

  useSttStream(
    (text: string) => {
      if (!text.trim()) return
      accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + text.trim()
      setTranscript(accumulatedRef.current)
      startSilenceTimer(accumulatedRef.current)
    },
    (errMsg: string) => setError(errMsg)
  )

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startSilenceTimer = useCallback((text: string) => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const finalText = accumulatedRef.current.trim()
      if (finalText && onSilence) {
        onSilence({ finalTranscript: finalText })
        accumulatedRef.current = ''
        setTranscript('')
      }
    }, 2000)
  }, [clearSilenceTimer, onSilence])

  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      // Stop Web Speech
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      isListeningRef.current = false
      setIsListening(false)
      clearSilenceTimer()
      setInterimTranscript('')
      return
    }

    // Start Web Speech primary
    isListeningRef.current = true
    setIsListening(true)
    setError(null)

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported')
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = isDesiMode ? 'en-IN' : language

    rec.onstart = () => setIsListening(true)
    rec.onerror = (e: { error: string }) => {
      setError(e.error)
      isListeningRef.current = false
      setIsListening(false)
    }
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const finalText = e.results[i][0].transcript
          accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + finalText
          setTranscript(accumulatedRef.current)
          startSilenceTimer(accumulatedRef.current)
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setInterimTranscript(interim)
    }
    rec.onend = () => {
      if (isListeningRef.current) {
        // Restart for continuous
        setTimeout(() => toggleListening(), 100)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }, [language, isDesiMode, clearSilenceTimer, startSilenceTimer])

  const recordWhisperFallback = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      await transcribeWhisper(blob)
      stream.getTracks().forEach(t => t.stop())
      // Auto-restart for continuous
      if (isListeningRef.current) {
        setTimeout(recordWhisperFallback, 100)
      }
    }

    recorder.start()
    // 4s chunks
    setTimeout(() => recorder.stop(), 4000)
  }, [transcribeWhisper])

  const resetTranscript = useCallback(() => {
    accumulatedRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    clearSilenceTimer()
  }, [clearSilenceTimer])

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    toggleListening,
    resetTranscript,
    language: isDesiMode ? 'en-IN' : language
  }
}

