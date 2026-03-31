"use client"
import { useRef, useState, useCallback, useEffect } from "react"

interface UseSystemAudioProps {
  onSilence?: (params: { finalTranscript: string }) => void
}

interface UseSystemAudioReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  error: string | null
  resetTranscript: () => void
  toggleListening: () => void
  language: string
}

export function useSystemAudio({
  onSilence,
}: UseSystemAudioProps = {}): UseSystemAudioReturn {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaStreamRef    = useRef<MediaStream | null>(null)
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const cycleTimeoutRef   = useRef<NodeJS.Timeout | null>(null)
  const mimeTypeRef       = useRef("")
  const finalTranscriptRef = useRef("")
  const isListeningRef    = useRef(false)
  const onSilenceRef      = useRef(onSilence)
  const silenceTimerRef   = useRef<NodeJS.Timeout | null>(null)
  const runCycleRef       = useRef<(() => void) | null>(null)

  useEffect(() => { onSilenceRef.current = onSilence }, [onSilence])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
  }, [])

  const startSilenceTimer = useCallback((text: string) => {
    clearSilenceTimer()
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const delay = wordCount <= 3 ? 2500 : wordCount <= 8 ? 2000 : 1800

    silenceTimerRef.current = setTimeout(() => {
      const textToSend = finalTranscriptRef.current.trim()
      const words = textToSend.split(/\s+/).filter(Boolean)

      if (words.length < 3) {
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

      // Amplitude VAD — skip silent chunks
      const isSpeech = await (async () => {
        try {
          const arr = await blob.arrayBuffer()
          const ctx = new AudioContext()
          const buf = await ctx.decodeAudioData(arr)
          const data = buf.getChannelData(0)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += Math.abs(data[i])
          ctx.close()
          return (sum / data.length) > 0.005
        } catch { return blob.size > 5000 }
      })()

      if (isSpeech && blob.size > 3000) {
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
              startSilenceTimer(finalTranscriptRef.current)
            }
          }
        } catch (err: any) {
          console.error("[SysAudio] transcription error:", err?.message)
        }
      }

      if (isListeningRef.current) runCycleRef.current?.()
    }

    recorder.start()
    cycleTimeoutRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop()
    }, 5000)
  }, [startSilenceTimer])

  useEffect(() => { runCycleRef.current = runRecordingCycle }, [runRecordingCycle])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    clearSilenceTimer()
    if (cycleTimeoutRef.current) { clearTimeout(cycleTimeoutRef.current); cycleTimeoutRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    mediaRecorderRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
  }, [clearSilenceTimer])

  const startListening = useCallback(async () => {
    try {
      setError(null)
      // getDisplayMedia shows the browser's screen-share picker.
      // User must tick "Share system audio" (Chrome on Windows) to capture speaker output.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        // Some browsers need a video constraint to show the dialog; we stop the track immediately.
        video: { width: 1, height: 1 },
        audio: true,
      } as DisplayMediaStreamOptions)

      // Drop the video track — we only want the audio
      stream.getVideoTracks().forEach(t => t.stop())

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        setError('No audio captured. In the share dialog, check "Share system audio" / "Share tab audio".')
        stream.getTracks().forEach(t => t.stop())
        return
      }

      // If the video track stops externally (user clicks "Stop sharing"), clean up
      audioTracks[0].onended = () => {
        stopListening()
      }

      mediaStreamRef.current = stream
      isListeningRef.current = true
      setIsListening(true)

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
        .find(m => MediaRecorder.isTypeSupported(m)) ?? ""
      mimeTypeRef.current = mimeType

      runRecordingCycle()
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        // User cancelled the share dialog — not an error worth showing
      } else {
        setError("System audio capture failed: " + (err.message ?? err.name))
      }
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [runRecordingCycle, stopListening])

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      finalTranscriptRef.current = ""
      setTranscript("")
      void startListening()
    }
  }, [stopListening, startListening])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ""
    setTranscript("")
    clearSilenceTimer()
  }, [clearSilenceTimer])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      clearSilenceTimer()
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current)
      if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop() } catch {} }
      if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()) }
    }
  }, [clearSilenceTimer])

  return {
    transcript,
    interimTranscript: "",  // system audio has no interim results
    isListening,
    error,
    resetTranscript,
    toggleListening,
    language: "auto",
  }
}
