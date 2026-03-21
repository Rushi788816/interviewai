'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useInterviewStore } from '@/store/interviewStore'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'
import type { SessionContext } from '@/types'
import { finalizeAssistantAnswer, sanitizeReadableText } from '@/lib/sanitizeText'
import OverlayWindow from '@/components/interview/OverlayWindow'
import MicrophoneButton from '@/components/interview/MicrophoneButton'
import DesiModeToggle from '@/components/interview/DesiModeToggle'
import LanguageSelector from '@/components/interview/LanguageSelector'
import TranscriptDisplay from '@/components/interview/TranscriptDisplay'
import AnswerDisplay from '@/components/interview/AnswerDisplay'
import SetupScreen from '@/components/interview/SetupScreen'

type InterviewType = 'technical' | 'behavioral' | 'coding'
type SessionPhase = 'idle' | 'running' | 'paused'

export interface InterviewAssistantProps {
  userId?: string
  credits?: number
  showFloatingLauncher?: boolean
  defaultOpen?: boolean
}

export default function InterviewAssistant({
  userId: _userId,
  credits: creditsProp,
  showFloatingLauncher = true,
  defaultOpen = false,
}: InterviewAssistantProps) {
  const { data: session, update: updateSession } = useSession()
  const addToast = useToast((s) => s.addToast)

  const [isOpen, setIsOpen] = useState(() => (showFloatingLauncher ? defaultOpen : true))
  const [interviewType, setInterviewType] = useState<InterviewType>('technical')
  const [isDesiMode, setIsDesiMode] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [isStreamingAnswer, setIsStreamingAnswer] = useState(false)
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showSetup, setShowSetup] = useState(true)
  const [invisibleMode, setInvisibleMode] = useState(false)
  const [showInvisibleHelp, setShowInvisibleHelp] = useState(false)
  /** Question for the current / last AI request (shown in invisible popup). */
  const [liveQuestion, setLiveQuestion] = useState('')

  const popupRef = useRef<Window | null>(null)
  const popupCheckIntervalRef = useRef<number | null>(null)

  const sessionContext = useInterviewStore((s) => s.sessionContext)
  const setSessionContextStore = useInterviewStore((s) => s.setSessionContext)
  const clearSessionContext = useInterviewStore((s) => s.clearSessionContext)
  const startBtnRef = useRef<HTMLButtonElement>(null)

  const interviewTypeRef = useRef(interviewType)
  const isDesiModeRef = useRef(isDesiMode)
  const languageRef = useRef(language)

  useEffect(() => {
    interviewTypeRef.current = interviewType
  }, [interviewType])
  useEffect(() => {
    isDesiModeRef.current = isDesiMode
  }, [isDesiMode])
  useEffect(() => {
    languageRef.current = language
  }, [language])

  const { balance, isLoading: creditsLoading, refetch: refetchCredits } = useCredits()
  const displayCredits = creditsProp ?? balance

  const addQAPair = useInterviewStore((s) => s.addQAPair)
  const qaHistory = useInterviewStore((s) => s.qaHistory)

  useEffect(() => {
    if (isOpen && sessionContext) {
      setShowSetup(false)
    }
  }, [isOpen, sessionContext])

  useEffect(() => {
    if (!showSetup && isOpen) {
      const t = window.setTimeout(() => startBtnRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [showSetup, isOpen])

  const openInvisibleMode = useCallback(() => {
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current)
      popupCheckIntervalRef.current = null
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }

    const width = 480
    const height = 600
    const left = window.screen.width - width - 20
    const top = 100

    const popup = window.open(
      '/interview/overlay',
      'InterviewAI_Overlay',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    )

    if (!popup) {
      addToast('Popup blocked — allow popups for this site to use Invisible Mode.', 'error')
      return
    }

    popupRef.current = popup
    setInvisibleMode(true)

    const sendInit = () => {
      if (popup.closed) return
      popup.postMessage(
        {
          type: 'INIT',
          isDesiMode: isDesiModeRef.current,
          interviewType: interviewTypeRef.current,
          sessionContext: useInterviewStore.getState().sessionContext,
        },
        window.location.origin
      )
    }

    popup.onload = sendInit
    window.setTimeout(sendInit, 100)
    window.setTimeout(sendInit, 500)

    popupCheckIntervalRef.current = window.setInterval(() => {
      if (popup.closed) {
        setInvisibleMode(false)
        popupRef.current = null
        if (popupCheckIntervalRef.current) {
          clearInterval(popupCheckIntervalRef.current)
          popupCheckIntervalRef.current = null
        }
      }
    }, 800)
  }, [addToast])

  useEffect(() => {
    if (!invisibleMode) return
    const w = popupRef.current
    if (!w || w.closed) return
    const creditsNum = typeof displayCredits === 'number' ? displayCredits : 0
    w.postMessage(
      {
        type: 'UPDATE',
        currentQuestion: liveQuestion,
        currentAnswer: streamingAnswer,
        isStreaming: isStreamingAnswer,
        qaHistory: qaHistory.map(({ question, answer }) => ({ question, answer })),
        credits: creditsNum,
        sessionActive: sessionPhase === 'running',
        isDesiMode,
        interviewType,
      },
      window.location.origin
    )
  }, [
    invisibleMode,
    liveQuestion,
    streamingAnswer,
    isStreamingAnswer,
    qaHistory,
    displayCredits,
    sessionPhase,
    isDesiMode,
    interviewType,
  ])

  useEffect(() => {
    return () => {
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current)
        popupCheckIntervalRef.current = null
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!showInvisibleHelp) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInvisibleHelp(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showInvisibleHelp])

  const handleSilence = useCallback(
    async (text: string) => {
      console.log('1. onSilence fired with text:', text)

      const questionClean = sanitizeReadableText(text, 4000)
      if (!questionClean || questionClean.trim().length < 3) {
        console.log('Text too short, skipping:', text)
        return
      }
      if (sessionPhase !== 'running') {
        console.log('Session not active, skipping')
        return
      }

      console.log('Sending question to AI:', questionClean)
      setLiveQuestion(questionClean.trim())
      setStreamingAnswer('')
      setIsStreamingAnswer(true)

      const ctx = useInterviewStore.getState().sessionContext
      const payload = {
        question: questionClean,
        isDesiMode: isDesiModeRef.current,
        interviewType: interviewTypeRef.current,
        language: languageRef.current,
        sessionContext: ctx ?? undefined,
      }
      console.log('2. Sending to API:', payload)

      try {
        const response = await fetch('/api/ai/interview-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        console.log('3. Response status:', response.status)
        console.log('4. Response ok:', response.ok)

        if (!response.ok) {
          const errorBody = await response.text()
          console.error('5. API error body:', errorBody)
          setStreamingAnswer('Error getting answer. Check console.')
          return
        }

        if (!response.body) {
          console.error('No response body')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullAnswer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6).trim()
            if (data === '[DONE]') {
              console.log('Stream complete, full answer:', fullAnswer)
              const cleaned = finalizeAssistantAnswer(fullAnswer)
              if (cleaned) {
                setStreamingAnswer(cleaned)
                addQAPair(questionClean.trim(), cleaned)
              }
              return
            }
            try {
              const parsed = JSON.parse(data) as {
                text?: string
                delta?: { text?: string }
                content?: string
              }
              const raw = parsed.text || parsed.delta?.text || parsed.content || ''
              const token = raw.replace(/\uFFFD/g, '')
              if (token) {
                fullAnswer += token
                setStreamingAnswer((prev) => prev + token)
                console.log('6. Token received:', token)
              }
            } catch {
              // ignore partial JSON
            }
          }
        }

        if (buffer.trim()) {
          for (const line of buffer.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6).trim()
            if (data === '[DONE]') {
              const cleaned = finalizeAssistantAnswer(fullAnswer)
              if (cleaned) {
                setStreamingAnswer(cleaned)
                addQAPair(questionClean.trim(), cleaned)
              }
              return
            }
            try {
              const parsed = JSON.parse(data) as {
                text?: string
                delta?: { text?: string }
                content?: string
              }
              const raw = parsed.text || parsed.delta?.text || parsed.content || ''
              const token = raw.replace(/\uFFFD/g, '')
              if (token) {
                fullAnswer += token
                setStreamingAnswer((prev) => prev + token)
                console.log('6. Token received:', token)
              }
            } catch {
              /* ignore */
            }
          }
        }

        const cleaned = finalizeAssistantAnswer(fullAnswer)
        if (cleaned) {
          setStreamingAnswer(cleaned)
          addQAPair(questionClean.trim(), cleaned)
        }
      } catch (error) {
        console.error('Fetch error:', error)
        setStreamingAnswer('Network error. Check console.')
      } finally {
        setIsStreamingAnswer(false)
      }
    },
    [addQAPair, sessionPhase]
  )

  const handleDesiToggle = useCallback(() => {
    setIsDesiMode((prev) => {
      const next = !prev
      setLanguage(next ? 'en-IN' : 'en-US')
      return next
    })
  }, [])

  const {
    transcript,
    interimTranscript,
    isListening,
    error: speechError,
    start: startListening,
    stop: stopListening,
    resetTranscript,
    toggleListening,
  } = useSpeechRecognition({
    language,
    isDesiMode,
    onSilence: handleSilence,
  })

  useEffect(() => {
    if (sessionPhase !== 'running') return
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [sessionPhase])

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleStartSession = () => {
    if (sessionPhase === 'idle') {
      setElapsedSeconds(0)
    }
    setSessionPhase('running')
    startListening()
  }

  const handlePauseSession = () => {
    setSessionPhase('paused')
    stopListening()
  }

  const finalizeStop = async () => {
    const dur = elapsedSeconds
    const history = [...qaHistory]
    const phase = sessionPhase
    const lang = language
    const mode = interviewType
    const desi = isDesiMode
    const ctx: SessionContext | null = useInterviewStore.getState().sessionContext

    if (
      session?.user?.id &&
      phase !== 'idle' &&
      (dur > 0 || history.length > 0)
    ) {
      try {
        const res = await fetch('/api/sessions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: dur,
            creditsUsed: history.length,
            qaHistory: history,
            language: lang,
            mode,
            isDesiMode: desi,
            transcript: [],
            jobRole: ctx?.jobRole ?? '',
            jobDescription: ctx?.jobDescription ?? '',
            resumeText: ctx?.resumeText ?? '',
            resumeFileName: ctx?.resumeFileName ?? '',
          }),
        })
        if (res.ok) {
          addToast('Session saved!', 'success')
          await refetchCredits()
          await updateSession?.()
        } else {
          addToast('Could not save session', 'error')
        }
      } catch {
        addToast('Could not save session', 'error')
      }
    }

    setSessionPhase('idle')
    setElapsedSeconds(0)
    stopListening()
    resetTranscript()
    setStreamingAnswer('')
    setLiveQuestion('')
    clearSessionContext()
    setShowSetup(true)
  }

  const handleStopSession = () => {
    void finalizeStop()
  }

  const handleCloseOverlay = () => {
    if (showSetup) {
      setIsOpen(false)
      return
    }
    void (async () => {
      await finalizeStop()
      setIsOpen(false)
    })()
  }

  const micDisabled = sessionPhase !== 'running'

  const handleMicToggle = () => {
    if (micDisabled) return
    toggleListening()
  }

  const handleSetupComplete = (ctx: SessionContext) => {
    setSessionContextStore(ctx)
    setShowSetup(false)
  }

  const handleSetupSkip = () => {
    clearSessionContext()
    setShowSetup(false)
  }

  const hasFullContext =
    !!sessionContext?.jobRole?.trim() &&
    !!sessionContext?.jobDescription?.trim() &&
    (!!sessionContext?.resumeText?.trim() || !!sessionContext?.resumeFileName)

  const hasRoleOnly =
    !!sessionContext?.jobRole?.trim() &&
    !hasFullContext

  if (!isOpen) {
    if (showFloatingLauncher) {
      return (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          style={{
            backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)',
            boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
          }}
        >
          🎤 Start Interview Assistant
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] px-6 py-3 font-semibold text-white hover:opacity-90"
      >
        Open Interview Assistant
      </button>
    )
  }

  if (showSetup) {
    return (
      <OverlayWindow>
        <div className="relative flex max-h-[92vh] flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleCloseOverlay}
            className="absolute right-3 top-3 z-10 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
          <SetupScreen
            onComplete={handleSetupComplete}
            onSkip={handleSetupSkip}
            initialContext={sessionContext}
          />
        </div>
      </OverlayWindow>
    )
  }

  return (
    <OverlayWindow>
      <div className="flex max-h-[92vh] flex-col overflow-hidden">
        <header className="flex flex-col gap-3 border-b border-zinc-800 p-4 pr-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white md:text-xl">AI Interview Coach</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                title="Credits balance"
              >
                {creditsLoading ? '…' : displayCredits} credits
              </span>
              <button
                type="button"
                onClick={openInvisibleMode}
                title="Opens AI answers in a separate window — invisible when you share this tab"
                className="rounded-lg border border-[#6c63ff] bg-[#16161f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6c63ff]/20"
              >
                👻 Invisible Mode
              </button>
              <button
                type="button"
                onClick={() => setShowInvisibleHelp(true)}
                className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-2.5 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
                aria-label="How to use Invisible Mode"
              >
                ℹ️
              </button>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-400"
                title={invisibleMode ? 'Popup window is open' : 'Answers show only in this window'}
              >
                {invisibleMode ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Invisible Mode Active
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-zinc-500" />
                    Visible Mode
                  </>
                )}
              </span>
              <DesiModeToggle isDesiMode={isDesiMode} onToggle={handleDesiToggle} />
              <LanguageSelector
                language={language}
                onChange={(code) => {
                  setLanguage(code)
                }}
              />
              <button
                type="button"
                onClick={handleCloseOverlay}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        {showInvisibleHelp && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invisible-help-title"
            onClick={() => setShowInvisibleHelp(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#16161f] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="invisible-help-title" className="text-lg font-bold text-white">
                How to use Invisible Mode
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
                <li>Click &quot;👻 Invisible Mode&quot; — a small popup window opens.</li>
                <li>In Zoom / Meet / Teams — click Share Screen.</li>
                <li>Choose &quot;Share a Tab&quot; or &quot;Share a Window&quot; — select only your interview tab or window.</li>
                <li>The AI popup window will not appear in that screen share.</li>
                <li>Position the popup on the corner of your screen for easy viewing.</li>
                <li>AI answers appear automatically as questions are detected.</li>
              </ol>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-relaxed text-zinc-500">
                Works with Zoom, Google Meet, Microsoft Teams, Webex, and any platform that allows tab or window
                sharing (not full desktop, if you need to hide the popup).
              </p>
              <button
                type="button"
                onClick={() => setShowInvisibleHelp(false)}
                className="mt-6 w-full rounded-xl bg-[#6c63ff] py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {invisibleMode && (
          <div className="mb-3 flex items-start gap-3 border-b border-[#43e97b22] bg-[#43e97b11] px-4 py-3">
            <span className="text-xl" aria-hidden>
              👻
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 font-bold text-[#43e97b]">Invisible Mode Active</div>
              <div className="text-[13px] leading-relaxed text-[#8888aa]">
                AI answers are showing in the separate popup window.
                <br />
                <strong className="text-[#f0f0f8]">To hide from interviewers:</strong> In Zoom / Meet / Teams, share
                only <em>this tab</em> or <em>this window</em> — the popup will not be captured.
              </div>
            </div>
            <button
              type="button"
              onClick={() => popupRef.current?.focus()}
              className="shrink-0 rounded-lg border border-[#6c63ff44] bg-[#6c63ff22] px-3 py-1.5 text-xs font-medium text-[#a89dff] hover:bg-[#6c63ff]/30"
            >
              Focus Popup
            </button>
          </div>
        )}

        {!sessionContext && (
          <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>⚡ Tip: Add your job role and resume for personalized AI answers</span>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
              >
                Setup
              </button>
            </div>
          </div>
        )}
        {sessionContext && hasFullContext && (
          <div className="border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
            ✅ Personalized for {sessionContext.jobRole} — AI answers are tailored to your role
          </div>
        )}
        {sessionContext && hasRoleOnly && (
          <div className="border-b border-sky-500/25 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-100">
            ℹ️ AI answers tailored for {sessionContext.jobRole} — Add JD and resume for even better answers
          </div>
        )}

        <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {(['technical', 'behavioral', 'coding'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInterviewType(type)}
                className={[
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  interviewType === type
                    ? 'border-violet-500 bg-violet-600/30 text-white'
                    : 'border-zinc-600 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500',
                ].join(' ')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {sessionContext && (
            <div className="mb-3 rounded-xl border border-white/[0.08] bg-[#16161f] p-3 text-xs text-zinc-300">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">Session context</span>
                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  className="text-[#6c63ff] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  🎯 Role: {sessionContext.jobRole || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${sessionContext.jobDescription?.trim() ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                  />
                  📋 JD {sessionContext.jobDescription?.trim() ? 'attached' : 'not set'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${sessionContext.resumeText?.trim() || sessionContext.resumeFileName ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                  />
                  📄 Resume {sessionContext.resumeText?.trim() || sessionContext.resumeFileName ? 'attached' : 'not set'}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="text-zinc-400">
              Session: <span className="font-mono text-white">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="text-zinc-400">
              Credits:{' '}
              <span className="font-semibold text-amber-300">{creditsLoading ? '—' : displayCredits}</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div className="mb-4">
            <TranscriptDisplay transcript={transcript} interimTranscript={interimTranscript} />
          </div>
          <div className="mb-4">
            <AnswerDisplay answer={streamingAnswer} isStreaming={isStreamingAnswer} />
          </div>

          {speechError && <p className="mb-2 text-sm text-red-400">Speech: {speechError}</p>}

          <div className="mt-auto border-t border-zinc-800 pt-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Session controls</div>
            <div className="flex flex-wrap items-center gap-3">
              <MicrophoneButton
                isListening={isListening}
                onToggle={handleMicToggle}
                disabled={micDisabled}
              />
              <button
                ref={startBtnRef}
                type="button"
                onClick={handleStartSession}
                disabled={sessionPhase === 'running'}
                className="rounded-lg border border-emerald-600 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sessionPhase === 'paused' ? 'Resume' : 'Start'}
              </button>
              <button
                type="button"
                onClick={handlePauseSession}
                disabled={sessionPhase !== 'running'}
                className="rounded-lg border border-amber-600 bg-amber-600/20 px-4 py-2 text-sm font-medium text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={handleStopSession}
                disabled={sessionPhase === 'idle'}
                className="rounded-lg border border-red-600 bg-red-600/20 px-4 py-2 text-sm font-medium text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Stop
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Mic works while session is running. After ~1.5s silence, your speech is sent to the AI.
            </p>
          </div>

          {qaHistory.length > 0 && (
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Q&amp;A history</div>
              <ul className="max-h-48 space-y-3 overflow-y-auto text-sm">
                {qaHistory.map((item, i) => (
                  <li
                    key={`${item.timestamp}-${i}`}
                    className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-3"
                  >
                    <p className="font-medium text-zinc-300">Q: {item.question}</p>
                    <p className="mt-1 whitespace-pre-wrap text-emerald-400/90">A: {item.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </OverlayWindow>
  )
}
