"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { useSession, signOut } from "next-auth/react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useSystemAudio } from "@/hooks/useSystemAudio"
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
      // Ctrl+Shift+E → send current question to AI
      onSendQuestion?: (cb: () => void) => void
      // Ctrl+Shift+S → screenshot captured, attaches to input box (user sends manually)
      onScreenshotAndSend?: (cb: (dataUrl: string) => void) => void
      moveWindow?: (dir: "left" | "right") => void
      minimizeWindow?: () => void
      hideWindow?: () => void
      setOpacity?: (value: number) => void
      setSetting?: (key: string, value: any) => Promise<void>
      getSettings?: () => Promise<Record<string, any>>
      onSettingsInit?: (cb: (settings: Record<string, any>) => void) => void
      removeAllListeners?: (channel: string) => void
      onSignOut?: (cb: () => void) => void
      captureScreenshotStealth?: () => Promise<string | null>
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
  const [answerMode, setAnswerMode] = useState<"code" | "verbal">("verbal")
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [liveQuestion, setLiveQuestion] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  // ── New feature state ────────────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState(14)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [manualQuestion, setManualQuestion] = useState("")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [audioSource, setAudioSource] = useState<"mic" | "system">("mic")
  const [overlayOpacity, setOverlayOpacity] = useState(95)
  const [isElectronApp, setIsElectronApp] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [useHistoryContext, setUseHistoryContext] = useState(false)

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
    setIsElectronApp(!!eAPI()?.isElectron)
  }, [])

  useEffect(() => {
    const api = eAPI()
    if (!api?.onModeSet) return
    api.onModeSet((data) => {
      setIsDesiMode(data.isDesiMode)
      if (data.language) setLanguage(data.language)
    })
  }, [])

  // Handle sign-out signal from tray menu
  useEffect(() => {
    const api = eAPI()
    if (!api?.onSignOut) return
    api.onSignOut(() => { void signOut({ callbackUrl: '/login' }) })
  }, [])

  // Load saved opacity from Electron settings
  useEffect(() => {
    const api = eAPI()
    if (!api?.isElectron) return
    api.onSettingsInit?.((s: any) => {
      if (s?.opacity) setOverlayOpacity(Math.round(s.opacity * 100))
    })
    // Also load immediately if already saved
    api.getSettings?.().then((s: any) => {
      if (s?.opacity) setOverlayOpacity(Math.round(s.opacity * 100))
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
    setAnswerMode("verbal") // reset until server tells us otherwise
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
          qaHistory: useHistoryContext ? (qaHistory?.slice(-5) ?? []) : [],
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
            // First event from server carries the render mode
            if (parsed.mode) {
              setAnswerMode(parsed.mode as "code" | "verbal")
              continue
            }
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
  }, [isDesiMode, interviewType, language, storeContext, qaHistory, useHistoryContext, addToast, addQAPair])

  // ── Shared silence handler (used by both STT sources) ───────────────────────
  const onSilenceHandler = useCallback(async ({ finalTranscript }: { finalTranscript: string }) => {
    if (!finalTranscript) return
    const words = finalTranscript.trim().split(/\s+/).filter(Boolean)
    if (words.length < 3) return
    if (sessionPhase !== "running") return
    setLiveQuestion(finalTranscript)
    setManualQuestion("")
    await fetchAIAnswer(finalTranscript)
  }, [sessionPhase, fetchAIAnswer])

  // ── Mic STT hook ─────────────────────────────────────────────────────────────
  const mic = useSpeechRecognition({
    language: isDesiMode ? "en-IN" : language,
    isDesiMode,
    onSilence: onSilenceHandler,
  })

  // ── System audio capture hook ─────────────────────────────────────────────────
  const sysAudio = useSystemAudio({ onSilence: onSilenceHandler })

  // ── Active source values (keep flat names so JSX doesn't change) ─────────────
  const transcript        = audioSource === "system" ? sysAudio.transcript        : mic.transcript
  const interimTranscript = audioSource === "system" ? ""                         : mic.interimTranscript
  const isListening       = audioSource === "system" ? sysAudio.isListening       : mic.isListening
  const audioError        = audioSource === "system" ? sysAudio.error             : mic.error

  const toggleListening = useCallback(() => {
    if (audioSource === "system") {
      if (mic.isListening) mic.toggleListening()
      sysAudio.toggleListening()
    } else {
      if (sysAudio.isListening) sysAudio.toggleListening()
      mic.toggleListening()
    }
  }, [audioSource, mic, sysAudio])

  const resetTranscript = useCallback(() => {
    mic.resetTranscript()
    sysAudio.resetTranscript()
  }, [mic, sysAudio])

  const handleAudioSourceSwitch = useCallback((src: "mic" | "system") => {
    if (src === audioSource) return
    // Stop whichever source is currently active
    if (mic.isListening) mic.toggleListening()
    if (sysAudio.isListening) sysAudio.toggleListening()
    setAudioSource(src)
    if (sessionPhase === "running") {
      addToast(`Switched to ${src === "system" ? "system audio" : "microphone"} — click the mic button to restart listening`, "info")
    }
  }, [audioSource, mic, sysAudio, sessionPhase, addToast])

  // ── Screenshot capture ───────────────────────────────────────────────────────
  const captureScreen = useCallback(async () => {
    // In Electron use desktopCapturer (no browser permission needed)
    if (eAPI()?.captureScreenshotStealth) {
      try {
        const dataUrl = await eAPI()!.captureScreenshotStealth!()
        if (dataUrl) {
          setScreenshots(prev => [...prev.slice(-4), dataUrl])
          addToast("Screenshot captured — attach a question and click Send", "success")
        } else {
          addToast("Screen capture failed — no screen source found", "error")
        }
      } catch {
        addToast("Screen capture failed", "error")
      }
      return
    }
    // Web fallback — browser getDisplayMedia
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

  // ── Sync voice transcript → question input ───────────────────────────────────
  useEffect(() => {
    if (isListening && transcript) setManualQuestion(transcript)
  }, [transcript, isListening])

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
    // Reset transcript so silence timer doesn't fire the same question again
    resetTranscript()
    await fetchAIAnswer(questionText, imgs)
  }, [manualQuestion, screenshots, sessionPhase, fetchAIAnswer, resetTranscript, addToast])

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
        if (audioSource === "mic") {
          try { await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {
            addToast("Microphone access denied. Please allow mic access and try again.", "error")
            return
          }
        }
        api.createOverlay()
      }
      setSessionPhase("running")
      resetTranscript()
      if (!isListening) toggleListening()
      eAPI()?.setStatus("listening")
    }
  }, [sessionPhase, isListening, toggleListening, resetTranscript, addToast, displayCredits, audioSource])

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
    api.removeAllListeners?.('session:stop')
    api.onStopSession(() => { void handleStopRef.current() })
    return () => { api.removeAllListeners?.('session:stop') }
  }, [])

  // Ctrl+Shift+E — send current question to AI
  useEffect(() => {
    const api = eAPI()
    if (!api?.onSendQuestion) return
    api.removeAllListeners?.('overlay:send-question')
    api.onSendQuestion(() => { void sendManualRef.current() })
    return () => { api.removeAllListeners?.('overlay:send-question') }
  }, [])

  // Ctrl+Shift+S — screenshot captured in main process → ATTACH to input, do NOT auto-send
  useEffect(() => {
    const api = eAPI()
    if (!api?.onScreenshotAndSend) return
    // Remove any stale listeners (hot-reload / re-mount safety)
    api.removeAllListeners?.('overlay:screenshot-send')
    api.onScreenshotAndSend((dataUrl: string) => {
      setScreenshots(prev => [...prev.slice(-4), dataUrl])
      addToast("Screenshot attached — type a question and click Send", "success")
      manualInputRef.current?.focus()
    })
    return () => {
      api.removeAllListeners?.('overlay:screenshot-send')
    }
  }, [addToast])

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

  const pill = (active: boolean, accent = "#F7931A") => ({
    background: active ? `rgba(${accent === "#F7931A" ? "247,147,26" : "129,140,248"},0.15)` : "transparent",
    border: `1px solid ${active ? accent : "rgba(255,255,255,0.1)"}`,
    borderRadius: "20px", padding: "4px 11px", fontSize: "12px",
    color: active ? accent : "#94A3B8", fontWeight: active ? "600" : "400" as any,
    cursor: "pointer" as const,
  })

  // ── Shared UI blocks ─────────────────────────────────────────────────────────
  const screenshotThumbnails = screenshots.length > 0 && (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
      {screenshots.map((src, i) => (
        <div key={i} style={{ position: "relative" as const }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Screenshot ${i + 1}`} style={{ height: "52px", width: "auto", maxWidth: "110px", objectFit: "cover", borderRadius: "6px", border: "2px solid rgba(247,147,26,0.4)" }} />
          <button onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", border: "none", borderRadius: "50%", width: "16px", height: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <X size={9} color="white" />
          </button>
        </div>
      ))}
    </div>
  )

  const handleClear = useCallback(() => {
    setManualQuestion("")
    setScreenshots([])
    setStreamingAnswer("")
    setLiveQuestion("")
    resetTranscript()
  }, [resetTranscript])

  const actionButtons = (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, alignItems: "center" }}>
      <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "6px 11px", color: "#94A3B8", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
        <Upload size={12} /> Upload
      </button>
      <button onClick={() => void captureScreen()} style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "6px 11px", color: "#818cf8", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
        <Camera size={12} /> Capture
      </button>
      <button
        onClick={handleClear}
        title="Clear question and answer"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 11px", color: "#64748B", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
      >
        <X size={12} /> Clear
      </button>
      <button
        onClick={() => void sendManualRef.current()}
        disabled={sessionPhase !== "running" || (manualQuestion.trim() === "" && screenshots.length === 0)}
        title={isElectronApp ? "Send (Ctrl+Shift+E)" : "Send (Ctrl+Enter)"}
        style={{ background: (manualQuestion.trim() || screenshots.length > 0) && sessionPhase === "running" ? "linear-gradient(135deg,#F7931A,#EA580C)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", padding: "6px 14px", color: (manualQuestion.trim() || screenshots.length > 0) && sessionPhase === "running" ? "white" : "#475569", fontSize: "12px", cursor: sessionPhase === "running" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600", marginLeft: "auto", opacity: sessionPhase !== "running" ? 0.5 : 1 }}
      >
        <Send size={12} /> Send <span style={{ opacity: 0.6, fontSize: "10px" }}>{isElectronApp ? "Ctrl+⇧+E" : "Ctrl+↵"}</span>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }} />
    </div>
  )

  const setupScreen = (
    <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap" as const, gap: "12px" }}>
        <div>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700" as const, margin: "0 0 6px" }}>🎯 Setup Your Interview Session</h2>
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
  )

  // ── ELECTRON compact layout ──────────────────────────────────────────────────
  if (isElectronApp) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0", padding: "8px 10px 10px", boxSizing: "border-box" as const, overflowY: "auto" }}>

        {showSetup ? setupScreen : <>

          {/* ── Top controls strip ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px", marginBottom: "8px", alignItems: "center" }}>
            {/* Interview type */}
            {(["technical", "behavioral", "coding"] as const).map(t => (
              <button key={t} onClick={() => setInterviewType(t)} style={pill(interviewType === t)}>
                {t === "technical" ? "⚙ Tech" : t === "behavioral" ? "🤝 Behav" : "💻 Code"}
              </button>
            ))}
            <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
            {/* Desi mode */}
            <button onClick={handleDesiToggle} style={pill(isDesiMode)}>🇮🇳 Desi</button>
            {/* Language */}
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "4px 8px", color: "#94A3B8", fontSize: "11px", cursor: "pointer" }}>
              <option value="en-US">EN-US</option>
              <option value="en-IN">EN-IN</option>
              <option value="hi-IN">Hindi</option>
              <option value="ta-IN">Tamil</option>
              <option value="te-IN">Telugu</option>
            </select>
            {/* Logout */}
            <button
              onClick={() => void signOut({ callbackUrl: '/login' })}
              title="Sign out"
              style={{ marginLeft: "auto", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "4px 9px", color: "#f87171", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
            >⏏ Sign Out</button>
          </div>

          {/* ── Audio source + Session controls ───────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" as const }}>
            {/* Audio source */}
            <button onClick={() => handleAudioSourceSwitch("mic")} title="Microphone" style={{ ...pill(audioSource === "mic"), padding: "4px 10px", fontSize: "11px" }}>🎤 Mic</button>
            <button onClick={() => handleAudioSourceSwitch("system")} title="System audio" style={{ ...pill(audioSource === "system", "#818cf8"), padding: "4px 10px", fontSize: "11px" }}>🔊 Sys</button>
            {/* Timer */}
            <span style={{ color: sessionPhase !== "idle" ? "#F7931A" : "#475569", fontSize: "16px", fontWeight: "700", fontFamily: "monospace", marginLeft: "4px" }}>{formatTime(elapsedSeconds)}</span>
            {/* Session buttons */}
            <div style={{ display: "flex", gap: "5px", marginLeft: "auto" }}>
              {sessionPhase === "idle" && (
                <button onClick={handleToggleSession} style={{ background: "linear-gradient(to right,#EA580C,#F7931A)", border: "none", borderRadius: "8px", padding: "5px 14px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>▶ Start</button>
              )}
              {sessionPhase === "running" && (
                <button onClick={handleToggleSession} style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#FCD34D", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Pause size={11} /> Pause
                </button>
              )}
              {sessionPhase === "paused" && (
                <button onClick={handleToggleSession} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#4ade80", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Play size={11} /> Resume
                </button>
              )}
              {sessionPhase !== "idle" && (
                <button onClick={handleStop} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#f87171", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Square size={11} /> Stop
                </button>
              )}
            </div>
          </div>

          {audioError && <p style={{ color: "#f87171", fontSize: "10px", margin: "0 0 6px", padding: "5px 8px", background: "rgba(239,68,68,0.08)", borderRadius: "6px" }}>{audioError}</p>}
          {audioSource === "system" && !isListening && (
            <p style={{ color: "#64748B", fontSize: "10px", margin: "0 0 6px", lineHeight: "1.5" }}>
              💡 In the share dialog, check <strong style={{ color: "#94A3B8" }}>"Share system audio"</strong>
            </p>
          )}

          {/* ── AI Answer (main area, always visible) ─────────────────── */}
          <div style={{ background: "#0B1120", border: `1px solid ${isStreamingAnswer ? "rgba(34,197,94,0.5)" : "rgba(34,197,94,0.2)"}`, borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", flexDirection: "column" as const, minHeight: "200px", flex: 1, transition: "border-color 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              {isStreamingAnswer
                ? <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.7)", flexShrink: 0 }} />
                : <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgba(74,222,128,0.25)", flexShrink: 0 }} />}
              <span style={{ color: "#4ade80", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: "700" }}>AI Answer</span>
              {liveQuestion && <span style={{ color: "#475569", fontSize: "10px", marginLeft: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "160px" }}>· {liveQuestion.slice(0, 40)}{liveQuestion.length > 40 ? "…" : ""}</span>}
              {isStreamingAnswer && <span style={{ marginLeft: "auto", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "1px 7px", fontSize: "10px", color: "#4ade80", flexShrink: 0 }}>● live</span>}
            </div>
            <div ref={answerScrollRef} style={{ flex: 1, overflowY: "auto", fontSize: `${fontSize}px` }}>
              {streamingAnswer ? (
                <StructuredAnswer text={streamingAnswer} isStreaming={isStreamingAnswer} fontSize={fontSize} mode={answerMode} />
              ) : (
                <p style={{ color: "#374151", fontSize: `${fontSize}px`, lineHeight: "1.7", margin: 0, fontStyle: "italic" }}>
                  {sessionPhase === "idle" ? "▶ Start session above to begin" : "Speak or type a question — AI answer streams here in real time"}
                </p>
              )}
            </div>
          </div>

          {/* ── Question (voice auto-fills + manual edit) ──────────────── */}
          <div style={{ background: "#0F1115", border: `1px solid ${isListening ? "rgba(247,147,26,0.35)" : "rgba(255,255,255,0.09)"}`, borderRadius: "10px", padding: "10px 12px", marginBottom: "6px", transition: "border-color 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              {isListening
                ? <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F7931A", boxShadow: "0 0 7px rgba(247,147,26,0.7)", flexShrink: 0 }} />
                : <MicOff size={10} color="#475569" />}
              <span style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: "600" }}>
                Question {screenshots.length > 0 && <span style={{ color: "#F7931A" }}>· {screenshots.length} screenshot{screenshots.length > 1 ? "s" : ""}</span>}
              </span>
              <button onClick={toggleListening} disabled={sessionPhase === "idle"} title="Toggle mic" style={{ marginLeft: "auto", background: isListening ? "rgba(247,147,26,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${isListening ? "rgba(247,147,26,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "6px", padding: "2px 8px", cursor: sessionPhase === "idle" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "3px", opacity: sessionPhase === "idle" ? 0.4 : 1 }}>
                {isListening ? <Mic size={11} color="#F7931A" /> : <MicOff size={11} color="#64748B" />}
              </button>
            </div>
            {screenshotThumbnails}
            <textarea
              ref={manualInputRef}
              value={manualQuestion}
              onChange={e => setManualQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendManualRef.current() } }}
              placeholder={isListening ? "Listening… speak your question" : "Type a question or turn on mic to speak…"}
              rows={2}
              style={{ width: "100%", boxSizing: "border-box" as const, background: "transparent", border: "none", color: "#fff", fontSize: `${fontSize}px`, resize: "none" as const, outline: "none", fontFamily: "inherit", marginTop: screenshots.length > 0 ? "8px" : 0 }}
            />
            {interimTranscript && (
              <p style={{ color: "#475569", fontSize: `${Math.max(fontSize - 1, 10)}px`, margin: "2px 0 0", fontStyle: "italic" }}>
                {interimTranscript}…
              </p>
            )}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
              {actionButtons}
            </div>
          </div>

          {/* ── Font size + Opacity ────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" as const }}>
            {/* Font size */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "3px 8px" }}>
              <span style={{ color: "#64748B", fontSize: "10px" }}>Aa</span>
              <button onClick={() => setFontSize(f => Math.max(f - 2, 10))} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "1px 3px", display: "flex" }}><ZoomOut size={12} /></button>
              <span style={{ color: "#F7931A", fontSize: "11px", fontWeight: "700", minWidth: "24px", textAlign: "center" }}>{fontSize}px</span>
              <button onClick={() => setFontSize(f => Math.min(f + 2, 22))} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "1px 3px", display: "flex" }}><ZoomIn size={12} /></button>
            </div>
            {/* Opacity */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "3px 8px", flex: 1 }}>
              <span style={{ color: "#64748B", fontSize: "10px" }}>👁</span>
              <input
                type="range" min={15} max={100} step={5} value={overlayOpacity}
                onChange={e => { const v = Number(e.target.value); setOverlayOpacity(v); eAPI()?.setOpacity?.(v / 100); eAPI()?.setSetting?.("opacity", v / 100) }}
                style={{ flex: 1, accentColor: "#F7931A", cursor: "pointer" }}
              />
              <span style={{ color: "#F7931A", fontSize: "11px", fontWeight: "700", minWidth: "30px" }}>{overlayOpacity}%</span>
            </div>
            {/* Credits */}
            <span style={{ background: "rgba(247,147,26,0.12)", border: "1px solid rgba(247,147,26,0.25)", borderRadius: "16px", padding: "3px 9px", fontSize: "11px", color: "#F7931A", fontWeight: "600" }}>🪙 {displayCredits}</span>
          </div>

          {/* ── Memory Context Toggle ─────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "7px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#94A3B8", fontSize: "11px" }}>🧠 Use past Q&A as context</span>
            <button
              onClick={() => setUseHistoryContext(v => !v)}
              disabled={qaHistory?.length === 0}
              style={{
                width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: qaHistory?.length === 0 ? "not-allowed" : "pointer",
                background: useHistoryContext ? "#F7931A" : "rgba(255,255,255,0.12)",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
                opacity: qaHistory?.length === 0 ? 0.4 : 1,
              }}
              title={qaHistory?.length === 0 ? "No history yet" : useHistoryContext ? "Memory ON — AI sees past Q&A" : "Memory OFF — each question answered independently"}
            >
              <span style={{
                position: "absolute", top: "3px", width: "14px", height: "14px", borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                left: useHistoryContext ? "19px" : "3px",
              }} />
            </button>
          </div>

          {/* ── Q&A History (collapsible) ──────────────────────────────── */}
          {qaHistory?.length > 0 && (
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", overflow: "hidden" }}>
              <button onClick={() => setShowHistory(h => !h)} style={{ width: "100%", background: "transparent", border: "none", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#64748B", fontSize: "11px", textAlign: "left" as const }}>
                <span>📋 Q&A History ({qaHistory.length})</span>
                <span style={{ marginLeft: "auto" }}>{showHistory ? "▲" : "▼"}</span>
              </button>
              {showHistory && (
                <div style={{ padding: "0 12px 10px", maxHeight: "130px", overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                  {qaHistory.slice(-4).reverse().map((item: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "7px", padding: "7px 10px" }}>
                      <p style={{ color: "#60a5fa", fontSize: "11px", margin: "0 0 2px" }}>Q: {item.question?.slice(0, 70)}{item.question?.length > 70 ? "…" : ""}</p>
                      <p style={{ color: "#94A3B8", fontSize: "11px", margin: 0 }}>A: {item.answer?.slice(0, 90)}{item.answer?.length > 90 ? "…" : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shortcuts hint */}
          <p style={{ color: "#374151", fontSize: "10px", textAlign: "center" as const, margin: "8px 0 0", lineHeight: "1.6" }}>
            Ctrl+⇧+H hide · Ctrl+⇧+E send · Ctrl+⇧+S screenshot · Ctrl+⇧+Q stop
          </p>

          {/* Document PiP portal */}
          {pip.isOpen && pip.container && createPortal(
            <PiPContent question={liveQuestion} answer={streamingAnswer} isStreaming={isStreamingAnswer} qaHistory={qaHistory} credits={displayCredits} sessionActive={sessionPhase === "running"} isDesiMode={isDesiMode} fontSize={fontSize} answerMode={answerMode} />,
            pip.container
          )}
        </>}
      </div>
    )
  }

  // ── BROWSER layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: "16px" }}>
      {showSetup ? setupScreen : (
        <>
          {/* Page Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>Live Interview Assistant</h1>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>AI answers stream privately to your screen in real-time</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "4px 10px" }}>
                <span style={{ color: "#64748B", fontSize: "11px", marginRight: "4px" }}>Aa</span>
                <button onClick={() => setFontSize(f => Math.max(f - 2, 10))} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px 4px", display: "flex" }}><ZoomOut size={14} /></button>
                <span style={{ color: "#F7931A", fontSize: "12px", fontWeight: "700", minWidth: "26px", textAlign: "center" }}>{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(f + 2, 22))} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "2px 4px", display: "flex" }}><ZoomIn size={14} /></button>
              </div>
              <div style={{ background: "rgba(247,147,26,0.15)", border: "1px solid rgba(247,147,26,0.3)", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", color: "#F7931A", fontWeight: "600" }}>🪙 {displayCredits} credits</div>
              {sessionPhase === "idle" && (
                <button onClick={handleToggleSession} style={{ background: "linear-gradient(to right,#EA580C,#F7931A)", border: "none", borderRadius: "20px", padding: "8px 20px", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 0 20px rgba(247,147,26,0.3)" }}>Start Session</button>
              )}
            </div>
          </div>

          {/* Context Banner */}
          {storeContext?.jobRole && (
            <div style={{ background: "rgba(247,147,26,0.06)", border: "1px solid rgba(247,147,26,0.2)", borderRadius: "10px", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", color: "#F7931A" }}>
                🎯 <strong>{storeContext.jobRole}</strong>
                {storeContext.jobDescription && <span style={{ color: "#94A3B8" }}> · 📋 JD</span>}
                {storeContext.resumeText && <span style={{ color: "#94A3B8" }}> · 📄 Resume</span>}
              </div>
              <button onClick={() => setShowSetup(true)} style={{ background: "transparent", border: "1px solid rgba(247,147,26,0.3)", borderRadius: "8px", padding: "4px 10px", color: "#F7931A", fontSize: "12px", cursor: "pointer" }}>Edit</button>
            </div>
          )}

          {/* Controls Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Interview Type</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(["technical", "behavioral", "coding"] as const).map(t => (
                  <button key={t} onClick={() => setInterviewType(t)} style={pill(interviewType === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
            </div>
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Mode & Language</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={handleDesiToggle} style={pill(isDesiMode)}>🇮🇳 Desi Mode</button>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "5px 10px", color: "#94A3B8", fontSize: "12px", cursor: "pointer" }}>
                  <option value="en-US">English (US)</option><option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option><option value="ta-IN">Tamil</option><option value="te-IN">Telugu</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "10px" }}>
                <span style={{ color: "#64748B", fontSize: "11px" }}>Input:</span>
                <button onClick={() => handleAudioSourceSwitch("mic")} style={pill(audioSource === "mic")}>🎤 Mic</button>
                <button onClick={() => handleAudioSourceSwitch("system")} style={pill(audioSource === "system", "#818cf8")}>🔊 System Audio</button>
              </div>
              {audioSource === "system" && <p style={{ color: "#64748B", fontSize: "10px", margin: "6px 0 0", lineHeight: "1.5" }}>Check <strong style={{ color: "#94A3B8" }}>"Share system audio"</strong> in the share dialog.</p>}
              {audioError && <p style={{ color: "#f87171", fontSize: "10px", margin: "6px 0 0" }}>{audioError}</p>}
            </div>
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", fontWeight: "600" }}>Session</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "white", fontSize: "22px", fontWeight: "700", fontFamily: "monospace" }}>{formatTime(elapsedSeconds)}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {sessionPhase === "running" && <button onClick={handleToggleSession} style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#FCD34D", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Pause size={12} /> Pause</button>}
                  {sessionPhase === "paused" && <button onClick={handleToggleSession} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#4ade80", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Play size={12} /> Resume</button>}
                  {sessionPhase !== "idle" && <button onClick={handleStop} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "5px 10px", color: "#f87171", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Square size={12} /> Stop</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content: Question + Answer */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
            {/* Left: Transcript + Input */}
            <div style={{ background: "#0F1115", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" as const, gap: "12px" }}>
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
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                <span style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>
                  Manual Question {screenshots.length > 0 && `· ${screenshots.length} screenshot${screenshots.length > 1 ? "s" : ""} attached`}
                </span>
              </div>
              <textarea ref={manualInputRef} value={manualQuestion} onChange={e => setManualQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void sendManualRef.current() } }}
                placeholder="Type a question or task... or attach a screenshot and click Send"
                rows={3} style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 12px", color: "#fff", fontSize: `${fontSize}px`, lineHeight: "1.6", resize: "vertical", outline: "none", fontFamily: "inherit" }}
              />
              {screenshotThumbnails}
              {actionButtons}
            </div>

            {/* Right: AI Answer */}
            <div style={{ background: "#0B1120", border: `1px solid ${isStreamingAnswer ? "rgba(34,197,94,0.5)" : "rgba(34,197,94,0.2)"}`, borderRadius: "12px", padding: "20px", minHeight: "280px", display: "flex", flexDirection: "column" as const }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isStreamingAnswer
                    ? <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.6)" }} />
                    : <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(74,222,128,0.2)" }} />}
                  <span style={{ color: "#4ade80", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>AI Answer</span>
                </div>
                {isStreamingAnswer && <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", color: "#4ade80" }}>● streaming</span>}
              </div>
              <div ref={answerScrollRef} style={{ flex: 1, overflowY: "auto", fontSize: `${fontSize}px` }}>
                {streamingAnswer ? (
                  <StructuredAnswer text={streamingAnswer} isStreaming={isStreamingAnswer} fontSize={fontSize} mode={answerMode} />
                ) : (
                  <p style={{ color: "#64748B", fontSize: `${fontSize}px`, lineHeight: "1.7", margin: 0, fontStyle: "italic" }}>
                    {sessionPhase === "idle" ? "Start a session above, then speak or type a question." : "Speak or type a question — AI answer appears here in real time."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Mic + History */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: "16px" }}>
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "12px" }}>
              <button onClick={toggleListening} disabled={sessionPhase === "idle"} style={{ width: "60px", height: "60px", borderRadius: "50%", background: isListening ? "linear-gradient(to bottom,#EA580C,#F7931A)" : "rgba(255,255,255,0.08)", border: "none", cursor: sessionPhase === "idle" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isListening ? "0 0 24px rgba(247,147,26,0.5)" : "none", opacity: sessionPhase === "idle" ? 0.4 : 1, transition: "all 0.3s" }}>
                {isListening ? <Mic size={24} color="white" /> : <MicOff size={24} color="#94A3B8" />}
              </button>
              <button onClick={handleStealthMode} style={{ background: pip.isOpen ? "rgba(34,197,94,0.12)" : "rgba(247,147,26,0.08)", border: `1px solid ${pip.isOpen ? "rgba(34,197,94,0.4)" : "rgba(247,147,26,0.25)"}`, borderRadius: "8px", padding: "6px 10px", color: pip.isOpen ? "#4ade80" : "#F7931A", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "100%", justifyContent: "center", fontWeight: "600" }}>
                <Ghost size={12} /> {pip.isOpen ? "Close" : pip.isSupported ? "Stealth" : "Overlay"}
              </button>
              {pip.isSupported && <span style={{ fontSize: "9px", color: "#4ade80", textAlign: "center" }}>● Screen-invisible</span>}
            </div>
            <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontWeight: "600" }}>Q&A History ({qaHistory?.length ?? 0})</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>🧠 Use as context</span>
                  <button
                    onClick={() => setUseHistoryContext(v => !v)}
                    disabled={!qaHistory?.length}
                    style={{
                      width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: !qaHistory?.length ? "not-allowed" : "pointer",
                      background: useHistoryContext ? "#F7931A" : "rgba(255,255,255,0.12)",
                      position: "relative", transition: "background 0.2s", flexShrink: 0,
                      opacity: !qaHistory?.length ? 0.4 : 1,
                    }}
                    title={!qaHistory?.length ? "No history yet" : useHistoryContext ? "Memory ON — AI sees past Q&A" : "Memory OFF — each question answered independently"}
                  >
                    <span style={{
                      position: "absolute", top: "3px", width: "14px", height: "14px", borderRadius: "50%",
                      background: "#fff", transition: "left 0.2s",
                      left: useHistoryContext ? "19px" : "3px",
                    }} />
                  </button>
                </div>
              </div>
              {qaHistory?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
                  {qaHistory.slice(-5).reverse().map((item: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                      <p style={{ color: "#60a5fa", fontSize: "12px", margin: "0 0 3px", fontWeight: "500" }}>Q: {item.question?.slice(0, 80)}{item.question?.length > 80 ? "…" : ""}</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>A: {item.answer?.slice(0, 100)}{item.answer?.length > 100 ? "…" : ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" as const, margin: 0 }}>No questions answered yet.</p>
              )}
            </div>
          </div>

          {/* Shortcuts */}
          <div style={{ background: "#0F1115", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            <button onClick={() => setShowShortcuts(s => !s)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#64748B", fontSize: "12px", textAlign: "left" }}>
              <Keyboard size={13} /> Keyboard Shortcuts <span style={{ marginLeft: "auto", fontSize: "10px" }}>{showShortcuts ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {showShortcuts && (
              <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px 24px" }}>
                {[["Ctrl+Enter","Send question"],["Ctrl+M","Toggle mic"],["Ctrl+S","Capture screenshot"],["Ctrl+D","Remove last screenshot"],["Ctrl+R","Clear input"],["Ctrl+E","Focus input"],["Ctrl+=","Font size +"],["Ctrl+-","Font size −"],["Ctrl+↑↓","Scroll answer"]].map(([k,d]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px", padding: "2px 7px", fontSize: "10px", color: "#F7931A", fontFamily: "monospace", whiteSpace: "nowrap" }}>{k}</span>
                    <span style={{ color: "#64748B", fontSize: "12px" }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pip.isOpen && pip.container && createPortal(
            <PiPContent question={liveQuestion} answer={streamingAnswer} isStreaming={isStreamingAnswer} qaHistory={qaHistory} credits={displayCredits} sessionActive={sessionPhase === "running"} isDesiMode={isDesiMode} fontSize={fontSize} answerMode={answerMode} />,
            pip.container
          )}
        </>
      )}
    </div>
  )
}

// ── Markdown segment parser (for code blocks) ────────────────────────────────
type MdSegment =
  | { type: "code"; lang: string; code: string }
  | { type: "text"; text: string }

function parseMarkdown(raw: string): MdSegment[] {
  const result: MdSegment[] = []
  const re = /```([\w]*)\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      const t = raw.slice(last, m.index).trim()
      if (t) result.push({ type: "text", text: t })
    }
    result.push({ type: "code", lang: m[1] || "code", code: m[2].trim() })
    last = m.index + m[0].length
  }
  const tail = raw.slice(last).trim()
  if (tail) result.push({ type: "text", text: tail })
  if (result.length === 0) result.push({ type: "text", text: raw })
  return result
}

// ── Code answer renderer ──────────────────────────────────────────────────────
function CodeAnswer({ text, isStreaming, fontSize }: { text: string; isStreaming: boolean; fontSize: number }) {
  const segments = parseMarkdown(text)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copyCode = (code: string, idx: number) => {
    void navigator.clipboard.writeText(code)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <div key={i} style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
            {/* Code block header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: "11px", color: "#F7931A", fontWeight: "700", fontFamily: "monospace", textTransform: "lowercase" }}>
                {seg.lang}
              </span>
              <button
                onClick={() => copyCode(seg.code, i)}
                style={{ background: copiedIdx === i ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${copiedIdx === i ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "6px", padding: "3px 10px", color: copiedIdx === i ? "#4ade80" : "#94A3B8", fontSize: "11px", cursor: "pointer", fontWeight: "600", transition: "all 0.15s" }}
              >
                {copiedIdx === i ? "✓ Copied" : "Copy"}
              </button>
            </div>
            {/* Code content */}
            <pre style={{ margin: 0, padding: "14px 16px", overflowX: "auto", scrollbarWidth: "thin" as const }}>
              <code style={{ color: "#e6edf3", fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace", fontSize: `${Math.max(fontSize - 1, 12)}px`, lineHeight: "1.65", display: "block", whiteSpace: "pre" as const }}>
                {seg.code}
              </code>
            </pre>
          </div>
        ) : (
          <p key={i} style={{ color: isStreaming && i === segments.length - 1 ? "#4ade80" : "#e2e8f0", fontSize: `${fontSize}px`, lineHeight: "1.75", margin: 0, whiteSpace: "pre-wrap" as const }}>
            {seg.text}
          </p>
        )
      )}
    </div>
  )
}

// ── Structured answer display (verbal mode) ───────────────────────────────────
function StructuredAnswer({ text, isStreaming, fontSize, mode = "verbal" }: { text: string; isStreaming: boolean; fontSize: number; mode?: "code" | "verbal" }) {
  if (mode === "code") {
    return <CodeAnswer text={text} isStreaming={isStreaming} fontSize={fontSize} />
  }

  const parts = text.split(" | ")
  const [keyPoint, detail, result] = [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""]

  // Still streaming the first part — no " | " yet
  if (parts.length === 1) {
    return <p style={{ color: isStreaming ? "#4ade80" : "#fff", fontSize: `${fontSize}px`, lineHeight: "1.7", margin: 0 }}>{text}</p>
  }

  const panels = [
    { label: "SAY THIS FIRST", content: keyPoint, accent: "#4ade80", bg: "rgba(34,197,94,0.07)" },
    { label: "DETAIL",         content: detail,   accent: "#60a5fa", bg: "rgba(96,165,250,0.07)" },
    { label: "RESULT",         content: result,   accent: "#F7931A", bg: "rgba(247,147,26,0.07)" },
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
function PiPContent({ question, answer, isStreaming, qaHistory, credits, sessionActive, isDesiMode, fontSize, answerMode }: {
  question: string; answer: string; isStreaming: boolean
  qaHistory: any[]; credits: number; sessionActive: boolean; isDesiMode: boolean; fontSize: number; answerMode: "code" | "verbal"
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
          {answer
            ? <StructuredAnswer text={answer} isStreaming={isStreaming} fontSize={fontSize} mode={answerMode} />
            : <span style={{ color: "#8888aa", fontStyle: "italic" }}>Waiting for question… speak naturally.</span>}
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
