"use client"
import { useState, useCallback, useRef } from "react"

export interface PiPState {
  isOpen: boolean
  isSupported: boolean   // documentPictureInPicture available (Chrome 116+)
  container: Element | null
  open: () => Promise<"pip" | "popup" | "blocked">
  close: () => void
}

/**
 * Manages a Document Picture-in-Picture window.
 * PiP windows render outside the browser compositor → typically invisible to screen recorders.
 * Falls back to a regular popup if the API isn't available.
 */
export function useDocumentPiP(onClose?: () => void): PiPState {
  const [isOpen, setIsOpen] = useState(false)
  const [container, setContainer] = useState<Element | null>(null)
  const pipWindowRef = useRef<Window | null>(null)

  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window

  const open = useCallback(async (): Promise<"pip" | "popup" | "blocked"> => {
    // ── Document PiP (Chrome 116+) ─────────────────────────────────────────
    if (isSupported) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 480,
          height: 420,
          disallowReturnToOpener: false,
        })

        // Base styles for the PiP document
        pip.document.documentElement.style.cssText = `
          background: #0a0a0f; margin: 0; padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
          color: #fff; font-size: 14px;
        `
        pip.document.body.style.cssText = `margin: 0; padding: 0; background: #0a0a0f;`

        // Inject global keyframes + scrollbar styles
        const style = pip.document.createElement("style")
        style.textContent = `
          * { box-sizing: border-box; }
          @keyframes pipPulse {
            0%,100% { opacity:.3; transform:scale(.8); }
            50%      { opacity:1; transform:scale(1.2); }
          }
          @keyframes pipSpin {
            to { transform: rotate(360deg); }
          }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #6366F166; border-radius: 4px; }
        `
        pip.document.head.appendChild(style)

        const root = pip.document.createElement("div")
        root.id = "pip-root"
        root.style.cssText = "min-height:100vh; background:#0a0a0f;"
        pip.document.body.appendChild(root)

        pipWindowRef.current = pip
        setContainer(root)
        setIsOpen(true)

        // Clean up when user closes the PiP window
        pip.addEventListener("pagehide", () => {
          setIsOpen(false)
          setContainer(null)
          pipWindowRef.current = null
          onClose?.()
        })

        return "pip"
      } catch (e: any) {
        console.warn("Document PiP failed:", e?.message)
        // Fall through to popup
      }
    }

    // ── Popup fallback ─────────────────────────────────────────────────────
    const left = window.screen.width - 500
    const popup = window.open(
      "/interview/overlay",
      "InterviewAI_Stealth",
      `width=480,height=500,left=${left},top=80,resizable=yes,scrollbars=yes`
    )
    if (popup) {
      pipWindowRef.current = popup
      setIsOpen(true)

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsOpen(false)
          pipWindowRef.current = null
          onClose?.()
        }
      }, 1000)

      return "popup"
    }

    return "blocked"
  }, [isSupported, onClose])

  const close = useCallback(() => {
    if (pipWindowRef.current) {
      try { pipWindowRef.current.close() } catch {}
      pipWindowRef.current = null
    }
    setIsOpen(false)
    setContainer(null)
    onClose?.()
  }, [onClose])

  return { isOpen, isSupported, container, open, close }
}
