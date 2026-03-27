"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useInterviewStore } from "@/store/interviewStore"
import { useCredits } from "@/hooks/useCredits"
import { useToast } from "@/hooks/useToast"
import { useDocumentPiP } from "@/hooks/useDocumentPiP"
import { Mic, MicOff, Pause, Square, Play, Ghost } from "lucide-react"
import SetupScreen from "@/components/interview/SetupScreen"
import type { SessionContext } from "@/types/index"

type InterviewType = "technical" | "behavioral" | "coding"
type SessionPhase = "idle" | "running" | "paused"

// ── Electron IPC bridge (only available in the desktop app) ──────────────────
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean
      sendAnswer: (data: { text?: string; done?: boolean }) => void
      sendQuestion: (text: string) => void
      setStatus: (status: "idle" | "listening" | "thinking" | "ready") => void
      clearOverlay: () => void
      toggleOverlay: () => void
    }
  }
}
const eAPI = () => (typeof window !== "undefined" ? window.electronAPI : undefined)

export default function InterviewAssistant({ userId, credits: creditsProp, showFloatingLauncher = false, defaultOpen = true }: any) {
  const { data: session } = useSession()
  const addToast = useToast((s: any) => s.addToast)
  const { balance, refetch: refetchCredits } = useCredits()
  const displayCredits = creditsProp ?? balance

  const [showSetup, setShowSetup] = useState(true)
  const [sessionContext, setSessionContextLocal] = useState<SessionContext | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType>("technical")
  const [isDesiMode, setIsDesiMode] = useState(false)
  const [language, setLanguage] = useState("en-US")
  const [streamingAnswer, setStreamingAnswer] = useState("")
  const [isStreamingAnswer, setIsStreamingAnswer] = useState(false)
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [liveQuestion, setLiveQuestion] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const pip = useDocumentPiP(() => {
    // called when PiP window is closed by user
  })

  const { sessionContext: storeContext, setSessionContext: setSessionContextStore, addQAPair, qaHistory } = useInterviewStore((s: any) => s)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Session timer
  useEffect(() => {
    if (sessionPhase !== "running") return
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [sessionPhase])

  const formatTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  const { transcript, interimTranscript, isListening, toggleListening, resetTranscript } = useSpeechRecognition({
    language: isDesiMode ? "en-IN" : language,
    isDesiMode,
    onSilence: async ({ finalTranscript }: { finalTranscript: string }) => {
      if (!finalTranscript) return
      const words = finalTranscript.trim().split(/\s+/).filter(Boolean)
      // Require at least 4 words — avoids firing on noise, single words, or partial phrases
      if (words.length < 4) return
      if (sessionPhase !== "running") return

      setLiveQuestion(finalTranscript)
      setStreamingAnswer("")
      setIsStreamingAnswer(true)

      // Forward question to Electron overlay (if running as desktop app)
      eAPI()?.sendQuestion(finalTranscript)
      eAPI()?.setStatus("thinking")

      try {
        const response = await fetch("/api/ai/interview-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: finalTranscript,
            isDesiMode,
            interviewType,
            language: isDesiMode ? "en-IN" : language,
            sessionContext: storeContext,
          }),
        })

        if (!response.ok || !response.body) { setIsStreamingAnswer(false); return }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let fullAnswer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6).trim()
            if (data === "[DONE]") {
              if (fullAnswer) addQAPair(finalTranscript, fullAnswer)
              setIsStreamingAnswer(false)
              // Signal overlay: streaming finished
              eAPI()?.sendAnswer({ done: true })
              eAPI()?.setStatus("ready")
              return
            }
            try {
              const parsed = JSON.parse(data)
              const token = parsed.text || parsed.delta?.text || ""
              if (token) {
                fullAnswer += token
                setStreamingAnswer(prev => prev + token)
                // Forward each token to Electron overlay
                eAPI()?.sendAnswer({ text: token })
              }
            } catch {}
          }
        }
        setIsStreamingAnswer(false)
      } catch { setIsStreamingAnswer(false) }
    }
  })

  const handleToggleSession = useCallback(() => {
    if (sessionPhase === "running") {
      setSessionPhase("paused")
      resetTranscript()
      if (isListening) toggleListening()
      eAPI()?.setStatus("idle")
    } else {
      setSessionPhase("running")
      resetTranscript()
      if (!isListening) toggleListening()
      eAPI()?.setStatus("listening")
    }
  }, [sessionPhase, isListening, toggleListening, resetTranscript])

  const handleStop = () => {
    setSessionPhase("idle")
    setElapsedSeconds(0)
    resetTranscript()
    if (isListening) toggleListening()
    setStreamingAnswer("")
    setLiveQuestion("")
    eAPI()?.setStatus("idle")
    eAPI()?.clearOverlay()
  }

  const handleDesiToggle = () => {
    const next = !isDesiMode
    setIsDesiMode(next)
    setLanguage(next ? "en-IN" : "en-US")
  }

  const handleStealthMode = async () => {
    if (pip.isOpen) { pip.close(); return }
    const result = await pip.open()
    if (result === "blocked") addToast("Popup blocked — please allow popups for this site", "error")
    else if (result === "pip") addToast("Stealth window opened — invisible to screen recorders ✓", "success")
    else addToast("Overlay opened — share only this tab to keep it hidden", "info")
  }

  const mainContainerStyle = {
    maxWidth: "1100px", 
    margin: "0 auto", 
    display: "flex", 
    flexDirection: "column" as const, 
    gap: "16px"
  }

  return (
    <div style={mainContainerStyle}>
      {showSetup ? (
        <div style={{
          background: "#0F1115",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "28px"
        }}>
          {/* Setup header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap" as const, gap: "12px" }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700" as const, margin: "0 0 6px", display: "flex", alignItems: "center", gap: "8px" }}>
                🎯 Setup Your Interview Session
              </h2>
              <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
                Help AI give you personalized answers
              </p>
            </div>
            <button
              onClick={() => setShowSetup(false)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "7px 16px",
                color: "#64748B",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Skip Setup
            </button>
          </div>
          <SetupScreen
            onComplete={(ctx: SessionContext) => { 
              setSessionContextStore(ctx); 
              setSessionContextLocal(ctx); 
              setShowSetup(false) 
            }}
            onSkip={() => setShowSetup(false)}
            initialContext={storeContext}
          />
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px", fontFamily: "var(--font-heading, system-ui)" }}>
                Live Interview Assistant
              </h1>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>AI answers stream privately to your screen in real-time</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "rgba(247,147,26,0.15)", border: "1px solid rgba(247,147,26,0.3)", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", color: "#F7931A", fontWeight: "600" }}>
                🪙 {displayCredits} credits
              </div>
              {sessionPhase === "idle" && (
                <button onClick={handleToggleSession} style={{ background: "linear-gradient(to right, #EA580C, #F7931A)", border: "none", borderRadius: "20px", padding: "8px 20px", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 0 20px rgba(247,147,26,0.3)" }}>
                  Start Session
                </button>
              )}
            </div>
          </div>

          {/* Context Banner if setup was done */}
          {storeContext?.jobRole && (
            <div style={{ background: "rgba(247,147,26,0.06)", border: "1px solid rgba(247,147,26,0.2)", borderRadius: "10px", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", color: "#F7931A" }}>
                🎯 <strong>{storeContext.jobRole}</strong>
                {storeContext.jobDescription && <span style={{ color: "#94A3B8" }}> · 📋 JD attached</span>}
                {storeContext.resumeText && <span style={{ color: "#94A3B8" }}> · 📄 Resume attached</span>}
              </div>
              <button onClick={() => setShowSetup(true)} style={{ background: "transparent", border: "1px solid rgba(247,147,26,0.3)", borderRadius: "8px", padding: "4px 10px", color: "#F7931A", fontSize: "12px", cursor: "pointer" }}>Edit</button>
            </div>
          )}

          {/* Controls Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "12px" }}>
            {/* Interview Type Card */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Interview Type</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(["technical", "behavioral", "coding"] as const).map(t => (
                  <button key={t} onClick={() => setInterviewType(t)} style={{
                    background: interviewType === t ? "rgba(247,147,26,0.15)" : "transparent",
                    border: `1px solid ${interviewType === t ? "#F7931A" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "20px", padding: "5px 12px", fontSize: "12px",
                    color: interviewType === t ? "#F7931A" : "#94A3B8",
                    fontWeight: interviewType === t ? "600" : "400", cursor: "pointer"
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Language Card */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Mode & Language</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleDesiToggle} style={{
                  background: isDesiMode ? "rgba(247,147,26,0.1)" : "transparent",
                  border: `1px solid ${isDesiMode ? "rgba(247,147,26,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "20px", padding: "5px 12px", fontSize: "12px",
                  color: isDesiMode ? "#F7931A" : "#94A3B8", cursor: "pointer", fontWeight: isDesiMode ? "600" : "400"
                }}>
                  🇮🇳 Desi Mode
                </button>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                  background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                  padding: "5px 10px", color: "#94A3B8", fontSize: "12px", cursor: "pointer"
                }}>
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="te-IN">Telugu</option>
                </select>
              </div>
            </div>

            {/* Session Timer Card */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Session</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "white", fontSize: "22px", fontWeight: "700", fontFamily: "monospace" }}>{formatTime(elapsedSeconds)}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {sessionPhase === "running" && (
                    <button onClick={handleToggleSession} style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#FCD34D", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Pause size={12} /> Pause
                    </button>
                  )}
                  {sessionPhase === "paused" && (
                    <button onClick={handleToggleSession} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#4ade80", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Play size={12} /> Resume
                    </button>
                  )}
                  {sessionPhase !== "idle" && (
                    <button onClick={handleStop} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#f87171", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Square size={12} /> Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: Transcript + Answer */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
            {/* Live Transcript */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", padding: "20px", minHeight: "180px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                {isListening && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F7931A", boxShadow: "0 0 8px rgba(247,147,26,0.6)" }} />}
                <span style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Live Transcript</span>
              </div>
              <p style={{ color: "#fff", fontSize: "15px", lineHeight: "1.65", margin: 0, fontStyle: transcript || interimTranscript ? "normal" : "italic", opacity: transcript || interimTranscript ? 1 : 0.4 }}>
                {transcript || interimTranscript || "Speech appears here. Start the session and use the microphone."}
              </p>
              {interimTranscript && <p style={{ color: "#94A3B8", fontSize: "13px", margin: "8px 0 0", fontStyle: "italic" }}>{interimTranscript}</p>}
            </div>

            {/* AI Answer */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "12px", padding: "20px", minHeight: "180px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isStreamingAnswer && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />}
                  <span style={{ color: "#4ade80", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>AI Answer</span>
                </div>
                {isStreamingAnswer && (
                  <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", color: "#4ade80" }}>streaming...</span>
                )}
              </div>
              <p style={{ color: isStreamingAnswer ? "#4ade80" : "#fff", fontSize: "14px", lineHeight: "1.7", margin: 0, fontStyle: streamingAnswer ? "normal" : "italic", opacity: streamingAnswer ? 1 : 0.4 }}>
                {streamingAnswer || "Speak a question... AI answer appears here after ~1.5s silence."}
              </p>
            </div>
          </div>

          {/* Bottom Row: Mic + Invisible Mode + Q&A History */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: "16px" }}>
            {/* Mic Controls */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "12px" }}>
              <button onClick={handleToggleSession}
                disabled={sessionPhase === "idle"}
                style={{
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: isListening ? "linear-gradient(to bottom, #EA580C, #F7931A)" : "rgba(255,255,255,0.08)",
                  border: "none", cursor: sessionPhase === "idle" ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isListening ? "0 0 24px rgba(247,147,26,0.5)" : "none",
                  opacity: sessionPhase === "idle" ? 0.4 : 1,
                  transition: "all 0.3s"
                }}>
                {isListening ? <Mic size={24} color="white" /> : <MicOff size={24} color="#94A3B8" />}
              </button>
              {/* Electron desktop: toggle the always-on-top invisible overlay */}
              {eAPI()?.isElectron ? (
                <>
                  <button
                    onClick={() => eAPI()?.toggleOverlay()}
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.4)",
                      borderRadius: "8px", padding: "6px 10px",
                      color: "#4ade80", fontSize: "11px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "4px",
                      width: "100%", justifyContent: "center", fontWeight: "600",
                    }}>
                    <Ghost size={12} />
                    Toggle Overlay
                  </button>
                  <span style={{ fontSize: "9px", color: "#4ade80", textAlign: "center", letterSpacing: "0.05em" }}>
                    🛡 OS-level invisible
                  </span>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStealthMode}
                    title={pip.isSupported ? "Document PiP — invisible to screen recorders" : "Popup overlay — hide by sharing only this tab"}
                    style={{
                      background: pip.isOpen ? "rgba(34,197,94,0.12)" : "rgba(247,147,26,0.08)",
                      border: `1px solid ${pip.isOpen ? "rgba(34,197,94,0.4)" : "rgba(247,147,26,0.25)"}`,
                      borderRadius: "8px", padding: "6px 10px",
                      color: pip.isOpen ? "#4ade80" : "#F7931A",
                      fontSize: "11px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "4px",
                      width: "100%", justifyContent: "center", fontWeight: "600",
                    }}>
                    <Ghost size={12} />
                    {pip.isOpen ? "Close Stealth" : pip.isSupported ? "Stealth" : "Overlay"}
                  </button>
                  {pip.isSupported && (
                    <span style={{ fontSize: "9px", color: "#4ade80", textAlign: "center", letterSpacing: "0.05em" }}>
                      ● Screen-invisible
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Q&A History */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px", fontWeight: "600" }}>
                Q&A History ({qaHistory?.length ?? 0})
              </p>
              {qaHistory && qaHistory.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
                  {qaHistory.slice(-5).reverse().map((item: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                      <p style={{ color: "#60a5fa", fontSize: "12px", margin: "0 0 3px", fontWeight: "500" }}>Q: {item.question?.slice(0, 80)}...</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>A: {item.answer?.slice(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" as const, margin: 0 }}>No questions answered yet. Start your session and speak.</p>
              )}
            </div>
          </div>

          {/* Document PiP portal — renders AI answers into the stealth window */}
          {pip.isOpen && pip.container && createPortal(
            <PiPContent
              question={liveQuestion}
              answer={streamingAnswer}
              isStreaming={isStreamingAnswer}
              qaHistory={qaHistory}
              credits={displayCredits}
              sessionActive={sessionPhase === "running"}
              isDesiMode={isDesiMode}
            />,
            pip.container
          )}
        </>
      )}
    </div>
  )
}

// ── PiP content rendered inside the Document PiP window ─────────────────────
function PiPContent({ question, answer, isStreaming, qaHistory, credits, sessionActive, isDesiMode }: {
  question: string; answer: string; isStreaming: boolean
  qaHistory: any[]; credits: number; sessionActive: boolean; isDesiMode: boolean
}) {
  return (
    <div style={{ padding: "12px", minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", padding: "8px 12px", background: "#111827", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: "13px" }}>InterviewAI</span>
          <span style={{ background: "#43e97b22", color: "#43e97b", borderRadius: "100px", padding: "1px 8px", fontSize: "10px", fontWeight: 700 }}>STEALTH</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
          <span style={{ background: "#f59e0b22", color: "#f59e0b", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>🪙 {credits}</span>
          <span style={{ background: sessionActive ? "#43e97b22" : "#ff658422", color: sessionActive ? "#43e97b" : "#ff6584", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>
            {sessionActive ? "● Live" : "○ Idle"}
          </span>
          {isDesiMode && <span style={{ background: "#6c63ff22", color: "#a89dff", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>🇮🇳</span>}
        </div>
      </div>

      {/* Question */}
      {question ? (
        <div style={{ background: "#111827", border: "1px solid #6c63ff44", borderLeft: "3px solid #6c63ff", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>🎙️ Question</div>
          <div style={{ fontSize: "13px", lineHeight: 1.5 }}>{question}</div>
        </div>
      ) : null}

      {/* AI Answer */}
      <div style={{ background: "#111827", border: "1px solid #43e97b44", borderLeft: "3px solid #43e97b", borderRadius: "10px", padding: "12px", marginBottom: "10px", minHeight: "100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "9px", color: "#43e97b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>🤖 AI Answer</div>
          {isStreaming && (
            <div style={{ display: "flex", gap: "3px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#43e97b", animation: `pipPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: "13px", lineHeight: 1.7, color: isStreaming ? "#43e97b" : "#f0f0f8" }}>
          {answer || <span style={{ color: "#8888aa", fontStyle: "italic" }}>Waiting for question… speak naturally.</span>}
        </div>
      </div>

      {/* Recent Q&A */}
      {qaHistory?.length > 0 && (
        <div>
          <div style={{ fontSize: "9px", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Recent Q&A</div>
          {qaHistory.slice(-3).reverse().map((qa: any, i: number) => (
            <div key={i} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px", opacity: i === 0 ? 1 : 0.55 }}>
              <div style={{ fontSize: "10px", color: "#8888aa", marginBottom: "3px" }}>Q: {qa.question?.slice(0, 60)}{qa.question?.length > 60 ? "…" : ""}</div>
              <div style={{ fontSize: "11px", lineHeight: 1.5, color: "#d0d0e0" }}>A: {qa.answer?.slice(0, 120)}{qa.answer?.length > 120 ? "…" : ""}</div>
            </div>
          ))}
        </div>
      )}

      {!question && !answer && qaHistory?.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#8888aa" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👻</div>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "6px" }}>Stealth Mode Active</div>
          <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
            This window is invisible to screen recorders.<br />
            Start your session and speak — AI answers appear here.
          </div>
        </div>
      )}
    </div>
  )
}

