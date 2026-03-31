"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useInterviewStore } from "@/store/interviewStore"
import { useCredits } from "@/hooks/useCredits"
import { useToast } from "@/hooks/useToast"
import { useDocumentPiP } from "@/hooks/useDocumentPiP"
import { Mic, MicOff, Pause, Square, Play, Ghost, Camera, Upload, Send, X, ZoomIn, ZoomOut, Keyboard } from "lucide-react"
import SetupScreen from "@/components/interview/SetupScreen"
import type { SessionContext } from "@/types/index"

type InterviewType = "technical" | "behavioral" | "coding"
type SessionPhase = "idle" | "running" | "paused"

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean
      createOverlay: () => void
      destroyOverlay: () => void
      checkMicPermission: () => Promise<"granted" | "denied" | "error">
      sendAnswer: (data: { text?: string; done?: boolean }) => void
      sendQuestion: (text: string) => void
      setStatus: (status: "idle" | "listening" | "thinking" | "ready") => void
      clearOverlay: () => void
      toggleOverlay: () => void
      showOverlay: () => void
      hideMainWindow: () => void
      showMainWindow: () => void
      onModeSet: (cb: (data: { isDesiMode: boolean; language?: string }) => void) => void
      // Manual question typed in overlay → forwarded here to hit the AI API
      onManualQuestion?: (cb: (data: { text: string; images?: string[] }) => void) => void
      // Stop session signal from global shortcut or overlay stop button
      onStopSession?: (cb: () => void) => void
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

  // ── New feature state ────────────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState(14)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [manualQuestion, setManualQuestion] = useState("")
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const answerScrollRef = useRef<HTMLDivElement>(null)
  const manualInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleStopRef = useRef<() => Promise<void>>(async () => {})
  const sendManualRef = useRef<() => Promise<void>>(async () => {})

  const { sessionContext: storeContext, setSessionContext: setSessionContextStore, addQAPair, qaHistory } = useInterviewStore((s: any) => s)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const api = eAPI()
    if (!api?.onModeSet) return
    api.onModeSet((data) => {
      setIsDesiMode(data.isDesiMode)
      if (data.language) setLanguage(data.language)
    })
  }, [])

  useEffect(() => {
    if (sessionPhase !== "running") return
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [sessionPhase])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // ── Core AI fetch (shared by STT auto-send and manual send) ─────────────────
  const fetchAIAnswer = useCallback(async (question: string, images: string[] = []) => {
    setStreamingAnswer("")
    setIsStreamingAnswer(true)
    eAPI()?.sendQuestion(question)
    eAPI()?.setStatus("thinking")

    try {
      const response = await fetch("/api/ai/interview-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          images: images.length > 0 ? images : undefined,
          isDesiMode,
          interviewType,
          language: isDesiMode ? "en-IN" : language,
          sessionContext: storeContext,
          qaHistory: qaHistory?.slice(-4) ?? [],
        }),
      })

      if (!response.ok || !response.body) {
        setIsStreamingAnswer(false)
        addToast("Couldn't get AI answer. Check your connection and try again.", "error")
        return
      }

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
            if (fullAnswer) addQAPair(question, fullAnswer)
            setIsStreamingAnswer(false)
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
              eAPI()?.sendAnswer({ text: token })
            }
          } catch {}
        }
      }
      setIsStreamingAnswer(false)
    } catch (err: any) {
      console.error("[AI] fetch error:", err?.message)
      setIsStreamingAnswer(false)
      addToast("Connection error. Please check your internet and try again.", "error")
    }
  }, [isDesiMode, interviewType, language, storeContext, qaHistory, addToast, addQAPair])

  // STT hook — auto-sends on silence
  const { transcript, interimTranscript, isListening, toggleListening, resetTranscript } = useSpeechRecognition({
    language: isDesiMode ? "en-IN" : language,
    isDesiMode,
    onSilence: async ({ finalTranscript }: { finalTranscript: string }) => {
      if (!finalTranscript) return
      const words = finalTranscript.trim().split(/\s+/).filter(Boolean)
      if (words.length < 3) return
      if (sessionPhase !== "running") return
      setLiveQuestion(finalTranscript)
      await fetchAIAnswer(finalTranscript)
    },
  })

  // ── Screenshot capture ───────────────────────────────────────────────────────
  const captureScreen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const video = document.createElement("video")
      video.srcObject = stream
      video.onloadedmetadata = () => {
        void video.play().then(() => {
          const MAX_W = 1280
          const ratio = Math.min(1, MAX_W / video.videoWidth)
          const canvas = document.createElement("canvas")
          canvas.width = Math.round(video.videoWidth * ratio)
          canvas.height = Math.round(video.videoHeight * ratio)
          canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
          stream.getTracks().forEach(t => t.stop())
          const base64 = canvas.toDataURL("image/jpeg", 0.65)
          setScreenshots(prev => [...prev.slice(-4), base64])
          addToast("Screenshot captured — attach a question and click Send", "success")
        })
      }
    } catch (e: any) {
      if (e.name !== "AbortError") addToast("Screen capture failed — allow screen recording in browser permissions", "error")
    }
  }, [addToast])

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { addToast("Only image files allowed", "error"); return }
    const reader = new FileReader()
    reader.onload = e => {
      const base64 = e.target?.result as string
      setScreenshots(prev => [...prev.slice(-4), base64])
    }
    reader.readAsDataURL(file)
  }, [addToast])

  // ── Manual question send (text + optional screenshots) ───────────────────────
  const sendManualQuestion = useCallback(async () => {
    const q = manualQuestion.trim()
    if (!q && screenshots.length === 0) { addToast("Type a question or attach a screenshot first", "error"); return }
    if (sessionPhase !== "running") { addToast("Start the session first", "error"); return }
    const questionText = q || "Analyze these screenshots and provide guidance on solving this task"
    setLiveQuestion(questionText)
    const imgs = [...screenshots]
    setManualQuestion("")
    setScreenshots([])
    await fetchAIAnswer(questionText, imgs)
  }, [manualQuestion, screenshots, sessionPhase, fetchAIAnswer, addToast])

  // Keep refs current so keyboard handler always has latest versions
  useEffect(() => { sendManualRef.current = sendManualQuestion }, [sendManualQuestion])

  // ── Keyboard shortcuts (page-level) ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      switch (e.key) {
        case "m": e.preventDefault(); if (sessionPhase === "running") toggleListening(); break
        case "Enter": e.preventDefault(); void sendManualRef.current(); break
        case "s": e.preventDefault(); void captureScreen(); break
        case "r": e.preventDefault(); setManualQuestion(""); setScreenshots([]); break
        case "d": e.preventDefault(); setScreenshots(prev => prev.slice(0, -1)); break
        case "=": case "+": e.preventDefault(); setFontSize(f => Math.min(f + 2, 22)); break
        case "-": e.preventDefault(); setFontSize(f => Math.max(f - 2, 10)); break
        case "ArrowDown": e.preventDefault(); answerScrollRef.current?.scrollBy({ top: 120, behavior: "smooth" }); break
        case "ArrowUp": e.preventDefault(); answerScrollRef.current?.scrollBy({ top: -120, behavior: "smooth" }); break
        case "e": e.preventDefault(); manualInputRef.current?.focus(); break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [sessionPhase, toggleListening, captureScreen])

  // ── Session controls ─────────────────────────────────────────────────────────
  const handleToggleSession = useCallback(async () => {
    if (sessionPhase === "running") {
      setSessionPhase("paused")
      resetTranscript()
      if (isListening) toggleListening()
      eAPI()?.setStatus("idle")
    } else {
      if (sessionPhase === "idle" && displayCredits === 0) {
        addToast("You have 0 credits. Go to Settings to get more before starting a session.", "error")
        return
      }
      const api = eAPI()
      if (api?.isElectron && sessionPhase === "idle") {
        try { await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {
          addToast("Microphone access denied. Please allow mic access and try again.", "error")
          return
        }
        api.createOverlay()
      }
      setSessionPhase("running")
      resetTranscript()
      if (!isListening) toggleListening()
      eAPI()?.setStatus("listening")
    }
  }, [sessionPhase, isListening, toggleListening, resetTranscript, addToast, displayCredits])

  const handleStop = useCallback(async () => {
    const duration = elapsedSeconds
    const savedQa = qaHistory
    const savedInterviewType = interviewType
    const savedIsDesiMode = isDesiMode
    const savedLanguage = isDesiMode ? "en-IN" : language
    const savedJobRole = storeContext?.jobRole ?? sessionContext?.jobRole ?? ""

    setSessionPhase("idle")
    setElapsedSeconds(0)
    resetTranscript()
    if (isListening) toggleListening()
    setStreamingAnswer("")
    setLiveQuestion("")
    setManualQuestion("")
    setScreenshots([])
    eAPI()?.setStatus("idle")
    eAPI()?.clearOverlay()
    eAPI()?.destroyOverlay()

    const creditsUsed = savedQa.length
    if (creditsUsed > 0) {
      try {
        await fetch("/api/sessions/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration, creditsUsed, qaHistory: savedQa, language: savedLanguage, mode: savedInterviewType, isDesiMode: savedIsDesiMode, jobRole: savedJobRole }),
        })
        refetchCredits()
      } catch {}
    }
  }, [elapsedSeconds, qaHistory, interviewType, isDesiMode, language, storeContext, sessionContext, isListening, toggleListening, resetTranscript, refetchCredits])

  // Keep handleStopRef current for PiP close callback
  useEffect(() => { handleStopRef.current = handleStop }, [handleStop])

  // Handle manual questions typed in the Electron overlay → send to AI
  useEffect(() => {
    const api = eAPI()
    if (!api?.onManualQuestion) return
    api.onManualQuestion((data) => { void fetchAIAnswer(data.text, data.images ?? []) })
  }, [fetchAIAnswer])

  // Handle stop-session from Electron global shortcut (Ctrl+Shift+Q)
  useEffect(() => {
    const api = eAPI()
    if (!api?.onStopSession) return
    api.onStopSession(() => { void handleStopRef.current() })
  }, [])

  const handleDesiToggle = () => {
    const next = !isDesiMode
    setIsDesiMode(next)
    setLanguage(next ? "en-IN" : "en-US")
  }

  // PiP — stop session when stealth window is closed
  const pip = useDocumentPiP(() => { void handleStopRef.current() })

  const handleStealthMode = async () => {
    if (pip.isOpen) { pip.close(); return }
    const result = await pip.open()
    if (result === "blocked") addToast("Popup blocked — please allow popups for this site", "error")
    else if (result === "pip") addToast("Stealth window opened — invisible to screen recorders ✓", "success")
    else addToast("Overlay opened — share only this tab to keep it hidden", "info")
  }

  const mainContainerStyle = { maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "16px" }

  return (
    <div style={mainContainerStyle}>
      {showSetup ? (
        <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap" as const, gap: "12px" }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700" as const, margin: "0 0 6px", display: "flex", alignItems: "center", gap: "8px" }}>
                🎯 Setup Your Interview Session
              </h2>
              <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>Help AI give you personalized answers</p>
            </div>
            <button onClick={() => setShowSetup(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "7px 16px", color: "#64748B", fontSize: "12px", cursor: "pointer" }}>
              Skip Setup
            </button>
          </div>
          <SetupScreen
            onComplete={(ctx: SessionContext) => { setSessionContextStore(ctx); setSessionContextLocal(ctx); setShowSetup(false) }}
            onSkip={() => setShowSetup(false)}
            initialContext={storeContext}
          />
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>Live Interview Assistant</h1>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>AI answers stream privately to your screen in real-time</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {/* Font size controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "4px 10px" }}>
                <span style={{ color: "#64748B", fontSize: "11px", marginRight: "4px" }}>Aa</span>
                <button onClick={() => setFontSize(f => Math.max(f - 2, 10))} title="Ctrl+-" style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                  <ZoomOut size={14} />
                </button>
                <span style={{ color: "#F7931A", fontSize: "12px", fontWeight: "700", minWidth: "26px", textAlign: "center" }}>{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(f + 2, 22))} title="Ctrl+=" style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                  <ZoomIn size={14} />
                </button>
              </div>
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

          {/* Context Banner */}
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
            {/* Interview Type */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Interview Type</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(["technical", "behavioral", "coding"] as const).map(t => (
                  <button key={t} onClick={() => setInterviewType(t)} style={{ background: interviewType === t ? "rgba(247,147,26,0.15)" : "transparent", border: `1px solid ${interviewType === t ? "#F7931A" : "rgba(255,255,255,0.1)"}`, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", color: interviewType === t ? "#F7931A" : "#94A3B8", fontWeight: interviewType === t ? "600" : "400", cursor: "pointer" }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Language */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Mode & Language</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleDesiToggle} style={{ background: isDesiMode ? "rgba(247,147,26,0.1)" : "transparent", border: `1px solid ${isDesiMode ? "rgba(247,147,26,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "20px", padding: "5px 12px", fontSize: "12px", color: isDesiMode ? "#F7931A" : "#94A3B8", cursor: "pointer", fontWeight: isDesiMode ? "600" : "400" }}>
                  🇮🇳 Desi Mode
                </button>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "5px 10px", color: "#94A3B8", fontSize: "12px", cursor: "pointer" }}>
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="te-IN">Telugu</option>
                </select>
              </div>
            </div>

            {/* Session Timer */}
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

          {/* Main Content: Question + Answer */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>

            {/* ── Left: Live Transcript + Manual Question + Screenshots ─────── */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Live transcript (auto from STT) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  {isListening && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F7931A", boxShadow: "0 0 8px rgba(247,147,26,0.6)" }} />}
                  <span style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Live Transcript</span>
                </div>
                <p style={{ color: "#fff", fontSize: `${fontSize}px`, lineHeight: "1.65", margin: 0, fontStyle: transcript || interimTranscript ? "normal" : "italic", opacity: transcript || interimTranscript ? 1 : 0.4 }}>
                  {transcript || interimTranscript || "Speech appears here. Start the session and speak."}
                </p>
                {interimTranscript && <p style={{ color: "#94A3B8", fontSize: "13px", margin: "6px 0 0", fontStyle: "italic" }}>{interimTranscript}</p>}
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                <span style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>
                  Task / Manual Question {screenshots.length > 0 && `· ${screenshots.length} screenshot${screenshots.length > 1 ? "s" : ""} attached`}
                </span>
              </div>

              {/* Editable manual question textarea */}
              <textarea
                ref={manualInputRef}
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendManualRef.current() } }}
                placeholder="Type a question or task... or just attach a screenshot below and click Send"
                rows={3}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", padding: "10px 12px",
                  color: "#fff", fontSize: `${fontSize}px`, lineHeight: "1.6",
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                }}
              />

              {/* Screenshot thumbnails */}
              {screenshots.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {screenshots.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Screenshot ${i + 1}`} style={{ height: "56px", width: "auto", maxWidth: "120px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)" }} />
                      <button
                        onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                      >
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image (Ctrl+U)"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "7px 12px", color: "#94A3B8", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500" }}
                >
                  <Upload size={13} /> Upload Image
                </button>
                <button
                  onClick={() => void captureScreen()}
                  title="Capture screen (Ctrl+S)"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "7px 12px", color: "#818cf8", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500" }}
                >
                  <Camera size={13} /> Capture Screen
                </button>
                <button
                  onClick={() => void sendManualRef.current()}
                  disabled={sessionPhase !== "running" || (manualQuestion.trim() === "" && screenshots.length === 0)}
                  title="Send (Ctrl+Enter)"
                  style={{ background: manualQuestion.trim() || screenshots.length > 0 ? "linear-gradient(135deg, #F7931A, #EA580C)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", padding: "7px 14px", color: manualQuestion.trim() || screenshots.length > 0 ? "white" : "#475569", fontSize: "12px", cursor: sessionPhase === "running" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600", marginLeft: "auto", opacity: sessionPhase !== "running" ? 0.5 : 1 }}
                >
                  <Send size={13} /> Send
                  <span style={{ opacity: 0.6, fontSize: "10px" }}>Ctrl+↵</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }} />
              </div>
            </div>

            {/* ── Right: AI Answer ──────────────────────────────────────────── */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "12px", padding: "20px", minHeight: "180px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isStreamingAnswer && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />}
                  <span style={{ color: "#4ade80", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>AI Answer</span>
                </div>
                {isStreamingAnswer && <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", color: "#4ade80" }}>streaming...</span>}
              </div>

              {/* Scrollable answer area */}
              <div ref={answerScrollRef} style={{ flex: 1, overflowY: "auto", fontSize: `${fontSize}px` }}>
                {streamingAnswer ? (
                  <StructuredAnswer text={streamingAnswer} isStreaming={isStreamingAnswer} fontSize={fontSize} />
                ) : (
                  <p style={{ color: "#64748B", fontSize: `${fontSize}px`, lineHeight: "1.7", margin: 0, fontStyle: "italic" }}>
                    Speak a question or send a screenshot task — AI answer appears here.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Mic + Stealth + Q&A History */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: "16px" }}>
            {/* Mic Controls */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "12px" }}>
              <button onClick={handleToggleSession} disabled={sessionPhase === "idle"} style={{ width: "60px", height: "60px", borderRadius: "50%", background: isListening ? "linear-gradient(to bottom, #EA580C, #F7931A)" : "rgba(255,255,255,0.08)", border: "none", cursor: sessionPhase === "idle" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isListening ? "0 0 24px rgba(247,147,26,0.5)" : "none", opacity: sessionPhase === "idle" ? 0.4 : 1, transition: "all 0.3s" }}>
                {isListening ? <Mic size={24} color="white" /> : <MicOff size={24} color="#94A3B8" />}
              </button>
              {eAPI()?.isElectron ? (
                <>
                  <button onClick={() => { eAPI()?.showOverlay(); eAPI()?.hideMainWindow() }} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "6px 10px", color: "#4ade80", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "center", fontWeight: "600" }}>
                    <Ghost size={12} /> Go Invisible
                  </button>
                  <span style={{ fontSize: "9px", color: "#4ade80", textAlign: "center", letterSpacing: "0.05em" }}>🛡 OS-level invisible</span>
                </>
              ) : (
                <>
                  <button onClick={handleStealthMode} style={{ background: pip.isOpen ? "rgba(34,197,94,0.12)" : "rgba(247,147,26,0.08)", border: `1px solid ${pip.isOpen ? "rgba(34,197,94,0.4)" : "rgba(247,147,26,0.25)"}`, borderRadius: "8px", padding: "6px 10px", color: pip.isOpen ? "#4ade80" : "#F7931A", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "center", fontWeight: "600" }}>
                    <Ghost size={12} /> {pip.isOpen ? "Close Stealth" : pip.isSupported ? "Stealth" : "Overlay"}
                  </button>
                  {pip.isSupported && <span style={{ fontSize: "9px", color: "#4ade80", textAlign: "center", letterSpacing: "0.05em" }}>● Screen-invisible</span>}
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
                      <p style={{ color: "#60a5fa", fontSize: "12px", margin: "0 0 3px", fontWeight: "500" }}>Q: {item.question?.slice(0, 80)}{item.question?.length > 80 ? "..." : ""}</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>A: {item.answer?.slice(0, 100)}{item.answer?.length > 100 ? "..." : ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" as const, margin: 0 }}>No questions answered yet. Start your session and speak.</p>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            <button
              onClick={() => setShowShortcuts(s => !s)}
              style={{ width: "100%", background: "transparent", border: "none", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#64748B", fontSize: "12px", textAlign: "left" }}
            >
              <Keyboard size={13} />
              Keyboard Shortcuts
              <span style={{ marginLeft: "auto", fontSize: "10px" }}>{showShortcuts ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showShortcuts && (
              <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px 24px" }}>
                {[
                  ["Ctrl+Enter", "Send manual question"],
                  ["Ctrl+M", "Toggle microphone"],
                  ["Ctrl+S", "Capture screenshot"],
                  ["Ctrl+D", "Remove last screenshot"],
                  ["Ctrl+R", "Clear question & screenshots"],
                  ["Ctrl+E", "Focus question input"],
                  ["Ctrl+=", "Increase font size"],
                  ["Ctrl+-", "Decrease font size"],
                  ["Ctrl+↑↓", "Scroll AI answer"],
                ].map(([key, desc]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "2px 7px", fontSize: "10px", color: "#F7931A", fontFamily: "monospace", whiteSpace: "nowrap" }}>{key}</span>
                    <span style={{ color: "#64748B", fontSize: "12px" }}>{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document PiP portal */}
          {pip.isOpen && pip.container && createPortal(
            <PiPContent question={liveQuestion} answer={streamingAnswer} isStreaming={isStreamingAnswer} qaHistory={qaHistory} credits={displayCredits} sessionActive={sessionPhase === "running"} isDesiMode={isDesiMode} fontSize={fontSize} />,
            pip.container
          )}
        </>
      )}
    </div>
  )
}

// ── Structured answer display ─────────────────────────────────────────────────
function StructuredAnswer({ text, isStreaming, fontSize }: { text: string; isStreaming: boolean; fontSize: number }) {
  const parts = text.split(" | ")
  const [keyPoint, detail, example] = [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""]

  if (parts.length === 1) {
    return <p style={{ color: isStreaming ? "#4ade80" : "#fff", fontSize: `${fontSize}px`, lineHeight: "1.7", margin: 0 }}>{text}</p>
  }

  const panels = [
    { label: "SAY THIS", content: keyPoint, accent: "#4ade80", bg: "rgba(34,197,94,0.07)" },
    { label: "DETAIL", content: detail, accent: "#60a5fa", bg: "rgba(96,165,250,0.07)" },
    { label: "EXAMPLE", content: example, accent: "#F7931A", bg: "rgba(247,147,26,0.07)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {panels.map(({ label, content, accent, bg }) => content ? (
        <div key={label} style={{ background: bg, borderLeft: `3px solid ${accent}`, borderRadius: "0 8px 8px 0", padding: "8px 12px" }}>
          <span style={{ fontSize: "9px", color: accent, fontWeight: "700", letterSpacing: "0.1em", display: "block", marginBottom: "3px" }}>{label}</span>
          <p style={{ color: "#fff", fontSize: `${fontSize}px`, lineHeight: "1.65", margin: 0 }}>{content}</p>
        </div>
      ) : null)}
    </div>
  )
}

// ── PiP stealth window content ────────────────────────────────────────────────
function PiPContent({ question, answer, isStreaming, qaHistory, credits, sessionActive, isDesiMode, fontSize }: {
  question: string; answer: string; isStreaming: boolean
  qaHistory: any[]; credits: number; sessionActive: boolean; isDesiMode: boolean; fontSize: number
}) {
  return (
    <div style={{ padding: "12px", minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", color: "#fff" }}>
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

      {question ? (
        <div style={{ background: "#111827", border: "1px solid #6c63ff44", borderLeft: "3px solid #6c63ff", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>🎙️ Question</div>
          <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}>{question}</div>
        </div>
      ) : null}

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
        <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.7, color: isStreaming ? "#43e97b" : "#f0f0f8" }}>
          {answer || <span style={{ color: "#8888aa", fontStyle: "italic" }}>Waiting for question… speak naturally.</span>}
        </div>
      </div>

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
