'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechCtor(): (new () => unknown) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => unknown
    webkitSpeechRecognition?: new () => unknown
  }
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => unknown) | null
}

export default function VoiceRecorder({
  language = 'en-US',
  value,
  onChange,
  onRecordingChange,
}: {
  language?: string
  value: string
  onChange: (v: string) => void
  onRecordingChange?: (active: boolean) => void
}) {
  const [interim, setInterim] = useState('')
  const [active, setActive] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop()
      } catch {
        /* noop */
      }
      recRef.current = null
    }
    setActive(false)
    setInterim('')
    onRecordingChange?.(false)
  }, [onRecordingChange])

  const start = useCallback(() => {
    const Ctor = getSpeechCtor()
    if (!Ctor) return
    const recognition = new Ctor() as {
      continuous: boolean
      interimResults: boolean
      lang: string
      start: () => void
      stop: () => void
      onresult: ((e: {
        resultIndex: number
        results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } }
      }) => void) | null
      onend: (() => void) | null
    }
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language
    recognition.onresult = (e: {
      resultIndex: number
      results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } }
    }) => {
      let final = ''
      let im = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else im += r[0].transcript
      }
      if (final) onChange(`${valueRef.current}${final}`.trim())
      setInterim(im)
    }
    recognition.onend = () => {
      setActive(false)
      setInterim('')
      onRecordingChange?.(false)
    }
    try {
      recognition.start()
      setActive(true)
      onRecordingChange?.(true)
      recRef.current = recognition
    } catch {
      setActive(false)
      onRecordingChange?.(false)
    }
  }, [language, onChange, onRecordingChange])

  const rerecord = useCallback(() => {
    stop()
    onChange('')
  }, [stop, onChange])

  useEffect(() => () => stop(), [stop])

  const bars = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#16161f] p-4">
      <div className={`flex h-16 items-end justify-center gap-1 ${active ? 'opacity-100' : 'opacity-40'}`}>
        {bars.map((i) => (
          <div
            key={i}
            className={`w-2 rounded-full bg-violet-500/90 ${active ? 'animate-pulse' : ''}`}
            style={{ height: `${24 + (i % 6) * 10}%` }}
          />
        ))}
      </div>
      <div className="min-h-[80px] rounded-lg border border-white/10 bg-[#0a0a0f] p-3 text-sm text-zinc-200">
        {value}
        <span className="text-zinc-500">{interim}</span>
      </div>
      <textarea
        className="min-h-[100px] w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white focus:border-[#6c63ff] focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type your answer…"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={active}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          🎤 Start Answering
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!active}
          className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          ⏹️ Stop
        </button>
        <button
          type="button"
          onClick={rerecord}
          className="rounded-xl bg-zinc-600 px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          🔄 Re-record
        </button>
      </div>
    </div>
  )
}
