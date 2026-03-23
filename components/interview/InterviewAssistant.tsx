"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useInterviewStore } from "@/store/interviewStore"
import { useCredits } from "@/hooks/useCredits"
import { useToast } from "@/hooks/useToast"
import { Mic, MicOff, Pause, Square, Play, Ghost, Info, ChevronDown } from "lucide-react"
import SetupScreen from "@/components/interview/SetupScreen"
import type { SessionContext } from "@/types/index"

type InterviewType = "technical" | "behavioral" | "coding"
type SessionPhase = "idle" | "running" | "paused"

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
  const [showInvisibleHelp, setShowInvisibleHelp] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const [invisibleMode, setInvisibleMode] = useState(false)

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
      if (!finalTranscript || finalTranscript.trim().length < 3) return
      if (sessionPhase !== "running") return

      setLiveQuestion(finalTranscript)
      setStreamingAnswer("")
      setIsStreamingAnswer(true)

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
              return
            }
            try {
              const parsed = JSON.parse(data)
              const token = parsed.text || parsed.delta?.text || ""
              if (token) { fullAnswer += token; setStreamingAnswer(prev => prev + token) }
            } catch {}
          }
        }
        setIsStreamingAnswer(false)
      } catch { setIsStreamingAnswer(false) }
    }
  })

  const handleStart = () => {
    setSessionPhase("running")
    if (!isListening) toggleListening()
  }

  const handlePause = () => {
    if (sessionPhase === "running") {
      setSessionPhase("paused")
      if (isListening) toggleListening()
    } else {
      setSessionPhase("running")
      if (!isListening) toggleListening()
    }
  }

  const handleStop = () => {
    setSessionPhase("idle")
    setElapsedSeconds(0)
    if (isListening) toggleListening()
    resetTranscript()
    setStreamingAnswer("")
    setLiveQuestion("")
    // Removed setShowSetup(true) to keep setup inline
  }

  const handleDesiToggle = () => {
    const next = !isDesiMode
    setIsDesiMode(next)
    setLanguage(next ? "en-IN" : "en-US")
  }

  const openInvisibleMode = () => {
    const popup = window.open("/interview/overlay", "InterviewAI_Overlay",
      `width=480,height=600,left=${window.screen.width - 500},top=100,resizable=yes`)
    if (popup) { popupRef.current = popup; setInvisibleMode(true) }
    else addToast("Popup blocked — allow popups for this site", "error")
  }

  // Send updates to popup
  useEffect(() => {
    if (invisibleMode && popupRef.current && !popupRef.current.closed) {
      popupRef.current.postMessage({
        type: "UPDATE", currentQuestion: liveQuestion, currentAnswer: streamingAnswer,
        isStreaming: isStreamingAnswer, qaHistory, credits: displayCredits, sessionActive: sessionPhase === "running"
      }, window.location.origin)
    }
  }, [streamingAnswer, liveQuestion, isStreamingAnswer, invisibleMode])

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
          borderRadius: "12px",
          padding: "24px"
        }}>
          <div style={{
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: "24px",
            flexWrap: "wrap" as const,
            gap: "12px"
          }}>
            <div>
              <h2 style={{ 
                color: "#fff", 
                fontSize: "24px", 
                fontWeight: "700" as const, 
                margin: "0 0 8px" 
              }}>
                🎯 Setup Your Interview Session
              </h2>
              <p style={{ 
                color: "#94A3B8", 
                fontSize: "14px", 
                margin: 0 
              }}>
                Help AI give you personalized answers
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setShowSetup(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  color: "#94A3B8",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Skip Setup
              </button>
            </div>
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
                <button onClick={handleStart} style={{ background: "linear-gradient(to right, #EA580C, #F7931A)", border: "none", borderRadius: "20px", padding: "8px 20px", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 0 20px rgba(247,147,26,0.3)" }}>
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
                    <button onClick={handlePause} style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#FCD34D", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Pause size={12} /> Pause
                    </button>
                  )}
                  {sessionPhase === "paused" && (
                    <button onClick={handlePause} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#4ade80", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
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
              <button onClick={() => sessionPhase === "running" ? (isListening ? toggleListening() : toggleListening()) : null}
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
              <button onClick={openInvisibleMode} style={{ background: "rgba(247,147,26,0.08)", border: "1px solid rgba(247,147,26,0.25)", borderRadius: "8px", padding: "6px 10px", color: "#F7931A", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "center" }}>
                <Ghost size={12} /> Invisible
              </button>
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

          {/* Invisible Mode Help Modal */}
          {showInvisibleHelp && (
            <div style={{ position: "fixed" as const, inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "32px", maxWidth: "480px", width: "100%" }}>
                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700" as const, marginBottom: "16px" }}>How Invisible Mode Works</h3>
                <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8", color: "#94A3B8", fontSize: "14px" }}>
                  <li>Click Invisible Mode — a popup opens</li>
                  <li>In Zoom/Meet — share only THIS tab</li>
                  <li>The popup stays hidden from screen share</li>
                  <li>AI answers appear in the popup automatically</li>
                </ol>
                <button onClick={() => setShowInvisibleHelp(false)} style={{ width: "100%", marginTop: "20px", padding: "12px", background: "linear-gradient(to right, #EA580C, #F7931A)", border: "none", borderRadius: "20px", color: "white", fontSize: "14px", fontWeight: "700" as const, cursor: "pointer" }}>Got it</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

