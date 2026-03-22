'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useInterviewStore } from "@/store/interviewStore"
import { useCredits } from "@/hooks/useCredits"
import { useToast } from "@/hooks/useToast"
import type { SessionContext } from "@/types"
import { sanitizeReadableText } from "@/lib/sanitizeText"
import OverlayWindow from "@/components/interview/OverlayWindow"
import MicrophoneButton from "@/components/interview/MicrophoneButton"
import DesiModeToggle from "@/components/interview/DesiModeToggle"
import LanguageSelector from "@/components/interview/LanguageSelector"
import TranscriptDisplay from "@/components/interview/TranscriptDisplay"
import AnswerDisplay from "@/components/interview/AnswerDisplay"
import SetupScreen from "@/components/interview/SetupScreen"

type InterviewType = "technical" | "behavioral" | "coding"
type SessionPhase = "idle" | "running" | "paused"

interface InterviewAssistantProps {
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

  // Toast selector moved to useCallback/useEffect to prevent render-phase effects
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
    useToast.getState().addToast(message, type, duration)
  }, [])

  // Toast moved to useEffect to avoid render-phase updates
  useEffect(() => {
    if (session?.user) {
      // Welcome toast on mount - safe in useEffect
    }
  }, [])

  // State
  const [isOpen, setIsOpen] = useState(() => (showFloatingLauncher ? defaultOpen : true))
  const [interviewType, setInterviewType] = useState<InterviewType>("technical")
  const [isDesiMode, setIsDesiMode] = useState(false)
  const [language, setLanguage] = useState("en-US")
  const [streamingAnswer, setStreamingAnswer] = useState("")
  const [isStreamingAnswer, setIsStreamingAnswer] = useState(false)
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showSetup, setShowSetup] = useState(true)
  const [invisibleMode, setInvisibleMode] = useState(false)
  const [showInvisibleHelp, setShowInvisibleHelp] = useState(false)
  const [liveQuestion, setLiveQuestion] = useState("")

  // Mobile responsive
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Store
  const sessionContext = useInterviewStore((s) => s.sessionContext)
  const setSessionContextStore = useInterviewStore((s) => s.setSessionContext)
  const clearSessionContext = useInterviewStore((s) => s.clearSessionContext)
  const addQAPair = useInterviewStore((s) => s.addQAPair)
  const qaHistory = useInterviewStore((s) => s.qaHistory)

  // Credits
  const { balance, isLoading: creditsLoading, refetch: refetchCredits } = useCredits()
  const displayCredits = creditsProp ?? balance

  // Speech
  const {
    transcript,
    interimTranscript,
    resetTranscript,
    toggleListening,
    language: currentLang,
    error: speechError
  } = useSpeechRecognition({
    language,
    isDesiMode,
    onSilence: ({ finalTranscript }) => {
      console.log('Silence detected, sending:', finalTranscript)
      // Add AI response logic here or via store action
      setLiveQuestion(finalTranscript)
    }
  })
  const [isListening, setIsListening] = useState(false)
  const [micDisabled, setMicDisabled] = useState(false)

  const startListening = useCallback(() => {
    toggleListening()
    setIsListening(true)
  }, [toggleListening])

  const stopListening = useCallback(() => {
    toggleListening()
    setIsListening(false)
  }, [toggleListening])

  // Refs
  const popupRef = useRef<Window | null>(null)
  const popupCheckIntervalRef = useRef<number | null>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)

  // Sync refs
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

  // Auto focus start button
  useEffect(() => {
    if (!showSetup && isOpen) {
      const t = window.setTimeout(() => startBtnRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [showSetup, isOpen])

  // Close existing popup when opening new invisible mode
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

  const openInvisibleMode = useCallback(() => {
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current)
      popupCheckIntervalRef.current = null
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }

    const width = isMobile ? 360 : 480
    const height = isMobile ? 500 : 600
    const left = window.screen.width - width - 20
    const top = 100

    const popup = window.open(
      '/interview/overlay',
      'InterviewAI_Overlay',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
    )

    if (!popup) {
      addToast("Popup blocked — allow popups for this site to use Invisible Mode.", "error")
      return
    }

    popupRef.current = popup
    setInvisibleMode(true)

    const sendInit = () => {
      if (popup.closed) return
      popup.postMessage(
        {
          type: "INIT",
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
  }, [addToast, isMobile])

  const handleDesiToggle = () => {
    const newDesiMode = !isDesiMode
    setIsDesiMode(newDesiMode)
    if (newDesiMode) {
      setLanguage("en-IN")
    } else {
      setLanguage("en-US")
    }
  }

  const handleStartSession = () => {
    if (sessionPhase === "idle") {
      setElapsedSeconds(0)
    }
    setSessionPhase("running")
    startListening()
  }

  const handlePauseSession = () => {
    setSessionPhase("paused")
    stopListening()
  }

  const handleStopSession = () => {
    setSessionPhase("idle")
    setElapsedSeconds(0)
    stopListening()
    resetTranscript()
    setStreamingAnswer("")
    setLiveQuestion("")
    clearSessionContext()
    setShowSetup(true)
  }

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  // Responsive styles
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: isMobile ? "12px" : "24px",
      maxWidth: isMobile ? "100vw" : "900px",
      margin: "0 auto",
    },
    headerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isMobile ? "8px" : "12px",
      minHeight: "44px",
      marginBottom: isMobile ? "8px" : "12px",
    },
    sessionInfo: {
      fontSize: isMobile ? "16px" : "14px",
      fontWeight: "600" as const,
    },
    transcriptBox: {
      minHeight: isMobile ? "100px" : "120px",
      maxHeight: isMobile ? "180px" : "200px",
      overflowY: "auto" as const,
      background: "rgba(59,130,246,0.08)",
      border: "1px solid rgba(59,130,246,0.3)",
      borderRadius: "12px",
      padding: "14px",
      fontSize: isMobile ? "16px" : "15px",
      lineHeight: "1.6" as const,
    },
    answerBox: {
      minHeight: isMobile ? "150px" : "160px",
      maxHeight: isMobile ? "280px" : "300px",
      overflowY: "auto" as const,
      background: "rgba(67,233,123,0.08)",
      border: "2px solid rgba(67,233,123,0.4)",
      borderLeft: "4px solid #43e97b",
      borderRadius: "12px",
      padding: "14px",
      fontSize: isMobile ? "16px" : "15px",
      lineHeight: "1.7" as const,
      color: "#43e97b",
    },
    micButton: {
      width: isMobile ? "64px" : "56px",
      height: isMobile ? "64px" : "56px",
      borderRadius: "50%",
      border: "none" as const,
      cursor: "pointer" as const,
      fontSize: "24px",
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    controlButton: {
      padding: isMobile ? "12px 20px" : "10px 20px",
      borderRadius: "10px",
      border: "none" as const,
      fontWeight: "700" as const,
      fontSize: isMobile ? "15px" : "14px",
      cursor: "pointer" as const,
      flex: "1" as const,
      minHeight: "44px",
    },
    tabButton: {
      padding: isMobile ? "12px 8px" : "8px 16px",
      borderRadius: "8px",
      border: "none" as const,
      fontWeight: "600" as const,
      fontSize: isMobile ? "14px" : "13px",
      cursor: "pointer" as const,
      flex: "1" as const,
      minHeight: "44px",
    },
    card: {
      backgroundColor: "#111827",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: isMobile ? "12px" : "16px",
    },
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed" as const,
          bottom: "24px",
          right: "24px" as const,
          zIndex: 50 as const,
          padding: "16px 24px",
          borderRadius: "16px",
          fontSize: "16px",
          fontWeight: "700" as const,
          color: "white",
          backgroundImage: "linear-gradient(90deg, #2563EB, #0EA5E9)",
          boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
          border: "none" as const,
          cursor: "pointer" as const,
        }}
      >
        🎤 Start Interview Assistant
      </button>
    )
  }

  if (showSetup) {
    return (
      <OverlayWindow>
        <div style={{ maxHeight: "92vh" as const, overflow: "hidden" as const }}>
          <SetupScreen
            onComplete={(ctx) => {
              setSessionContextStore(ctx)
              setShowSetup(false)
            }}
            onSkip={() => setShowSetup(false)}
            initialContext={sessionContext}
          />
        </div>
      </OverlayWindow>
    )
  }

  return (
    <OverlayWindow>
      <div style={{ 
        display: "flex" as const, 
        maxHeight: "92vh" as const, 
        flexDirection: "column" as const, 
        overflow: "hidden" as const, 
        ...styles.container 
      }}>
        {/* Header */}
        <header style={{ 
          borderBottom: "1px solid rgba(255,255,255,0.08)", 
          padding: isMobile ? "12px" : "16px", 
          paddingRight: "12px",
          position: "relative" 
        }}>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#94A3B8",
              fontSize: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "1",
              zIndex: 10,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            title="Close"
          >
            ×
          </button>

          <div style={styles.headerRow}>
            <h2 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: "bold" as const, color: "white", margin: 0 }}>
              AI Interview Coach
            </h2>
            <div style={{ 
              padding: "8px 12px",
              backgroundColor: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600" as const,
              color: "rgb(251,191,36)",
            }}>
              {creditsLoading ? "…" : displayCredits} credits
            </div>
          </div>
          
          <div style={styles.headerRow}>
            <button
              onClick={openInvisibleMode}
              style={{
                ...styles.controlButton,
                backgroundColor: "rgba(37,99,235,0.2)",
                border: "1px solid rgba(37,99,235,0.5)",
                color: "white",
              }}
            >
              👻 Invisible Mode
            </button>
            <button
              onClick={() => setShowInvisibleHelp(true)}
              style={{
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "16px",
                minHeight: "44px",
                minWidth: "44px",
              }}
            >
              ℹ️
            </button>
            <DesiModeToggle isDesiMode={isDesiMode} onToggle={handleDesiToggle} />
          </div>

          <div style={{ width: "100%" }}>
            <LanguageSelector language={language} onChange={setLanguage} />
          </div>
        </header>

        {/* Session info */}
        <div style={{ 
          ...styles.card, 
          marginBottom: "12px",
          padding: isMobile ? "12px" : "16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          ...styles.sessionInfo 
        }}>
          <div style={{ display: "flex" as const, gap: "16px", flexWrap: "wrap" as const, fontSize: "16px" }}>
            <div style={{ color: "rgb(148,163,184)", fontWeight: "600" as const }}>
              Session: <span style={{ color: "white", fontFamily: "monospace" }}>{formatTime(elapsedSeconds)}</span>
            </div>
            <div style={{ color: "rgb(148,163,184)", fontWeight: "600" as const }}>
              Credits: <span style={{ color: "rgb(251,191,36)", fontWeight: "bold" }}>{displayCredits}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex" as const, 
          gap: "8px", 
          marginBottom: "16px",
          flexWrap: "wrap" as const 
        }}>
          {(["technical", "behavioral", "coding"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setInterviewType(type)}
              style={{
                ...styles.tabButton,
                backgroundColor: interviewType === type ? "rgb(139,92,246)" : "rgba(0,0,0,0.4)",
                color: interviewType === type ? "white" : "rgb(148,163,184)",
                border: interviewType === type ? "1px solid rgb(139,92,246)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Main panels */}
        <div style={{ display: "flex" as const, flexDirection: "column" as const, gap: "16px", flex: "1" as const, overflow: "hidden" as const, minHeight: 0 }}>
          <div style={styles.transcriptBox}>
            <div style={{ fontSize: "14px", fontWeight: "600" as const, color: "rgb(59,130,246)", marginBottom: "8px" }}>
              🎙️ LIVE TRANSCRIPT
            </div>
            <TranscriptDisplay transcript={transcript} interimTranscript={interimTranscript} isMobile={isMobile} />
          </div>

          <div style={styles.answerBox}>
            <div style={{ fontSize: "14px", fontWeight: "bold" as const, marginBottom: "8px" }}>
              🤖 AI ANSWER
              {isStreamingAnswer && (
                <span style={{ 
                  backgroundColor: "rgba(67,233,123,0.3)",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  marginLeft: "8px",
                }}>
                  streaming…
                </span>
              )}
            </div>
            <AnswerDisplay answer={streamingAnswer} isStreaming={isStreamingAnswer} isMobile={isMobile} />
          </div>
        </div>

        {/* Controls */}
        <div style={{ 
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "12px",
        }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase" as const, fontWeight: "600" as const, color: "rgb(148,163,184)", marginBottom: "12px" }}>
            Session controls
          </div>
          <div style={{ display: "flex" as const, gap: "12px", alignItems: "center" as const, flexWrap: "wrap" as const }}>
            <MicrophoneButton
              isListening={isListening}
              onToggle={() => {
                if (isListening) {
                  stopListening()
                } else {
                  startListening()
                }
              }}
              disabled={micDisabled || !!speechError}
              isMobile={isMobile}
            />
            <div style={{ display: "flex" as const, flex: "1" as const, gap: "8px", minWidth: 0 }}>
              <button
                ref={startBtnRef}
                onClick={handleStartSession}
                disabled={sessionPhase === "running"}
                style={{
                  ...styles.controlButton,
                  backgroundColor: sessionPhase === "running" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                  border: "1px solid rgba(34,197,94,0.5)",
                  color: "rgb(34,197,94)",
                }}
              >
                {sessionPhase === "paused" ? "Resume" : "Start"}
              </button>
              <button
                onClick={handlePauseSession}
                disabled={sessionPhase !== "running"}
                style={{
                  ...styles.controlButton,
                  backgroundColor: "rgba(251,191,36,0.2)",
                  border: "1px solid rgba(251,191,36,0.5)",
                  color: "rgb(251,191,36)",
                }}
              >
                Pause
              </button>
              <button
                onClick={handleStopSession}
                disabled={sessionPhase === "idle"}
                style={{
                  ...styles.controlButton,
                  backgroundColor: "rgba(239,68,68,0.2)",
                  border: "1px solid rgba(239,68,68,0.5)",
                  color: "rgb(239,68,68)",
                }}
              >
                Stop
              </button>
            </div>
          </div>
          <p style={{ textAlign: "center" as const, marginTop: "12px", fontSize: "14px", color: "rgb(148,163,184)" }}>
            Mic active during session. AI responds after ~1.5s silence.
          </p>
        </div>

        {/* Q&A History */}
        {qaHistory.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ ...styles.card, maxHeight: isMobile ? "200px" : "300px", overflowY: "auto" }}>
              <div style={{ marginBottom: "12px", fontSize: "12px", fontWeight: "600" as const, color: "rgb(148,163,184)", textTransform: "uppercase" as const }}>
                Q&A History ({qaHistory.length})
              </div>
              {qaHistory.slice(-3).map((item, i) => (
                <div key={i} style={{ marginBottom: "12px", padding: "12px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                  <div style={{ fontWeight: "500" as const, color: "rgb(59,130,246)", marginBottom: "4px", fontSize: "14px" }}>
                    Q: {item.question.slice(0, 100)}...
                  </div>
                  <div style={{ color: "#43e97b", fontSize: "14px", lineHeight: "1.4" }}>
                    A: {item.answer.slice(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invisible help modal */}
        {showInvisibleHelp && (
          <div style={{ 
            position: "fixed" as const, 
            inset: 0, 
            zIndex: 100 as const, 
            display: "flex" as const,
            alignItems: "center" as const, 
            justifyContent: "center" as const, 
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: "20px",
          }}>
            <div style={{ 
              ...styles.card, 
              maxWidth: isMobile ? "95vw" : "500px",
              maxHeight: "90vh",
              overflowY: "auto" as const,
            }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold" as const, color: "white", marginBottom: "16px" }}>
                How Invisible Mode Works
              </h3>
              <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6", color: "rgb(200,200,200)" }}>
                <li>Click "👻 Invisible Mode" — popup opens</li>
                <li>Share screen: Choose <em>Tab</em> or <em>Window</em> (this tab only)</li>
                <li>Popup stays hidden from screen share</li>
                <li>Position popup in corner while interviewing</li>
              </ol>
              <button
                onClick={() => setShowInvisibleHelp(false)}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "14px",
                  backgroundImage: "linear-gradient(90deg, #2563EB, #0EA5E9)",
                  border: "none" as const,
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600" as const,
                  cursor: "pointer" as const,
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </OverlayWindow>
  )
}
