'use client'

import { useEffect, useState } from 'react'
import type { SessionContext } from '@/types'

interface OverlayData {
  currentQuestion: string
  currentAnswer: string
  isStreaming: boolean
  qaHistory: Array<{ question: string; answer: string }>
  credits: number
  sessionActive: boolean
  isDesiMode: boolean
  interviewType: string
  sessionContext?: SessionContext | null
}

const emptyData: OverlayData = {
  currentQuestion: '',
  currentAnswer: '',
  isStreaming: false,
  qaHistory: [],
  credits: 0,
  sessionActive: false,
  isDesiMode: false,
  interviewType: 'technical',
  sessionContext: null,
}

export default function OverlayPage() {
  const [data, setData] = useState<OverlayData | null>(null)
  const [opacity, setOpacity] = useState(90)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState<'dark' | 'light' | 'minimal'>('dark')

  useEffect(() => {
    document.title = '\u200B'
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const d = event.data
      if (!d || typeof d !== 'object') return

      if (d.type === 'INIT') {
        setData((prev) => ({
          ...(prev ?? emptyData),
          isDesiMode: Boolean(d.isDesiMode),
          interviewType: typeof d.interviewType === 'string' ? d.interviewType : 'technical',
          sessionContext: d.sessionContext ?? null,
        }))
        return
      }

      if (d.type === 'UPDATE') {
        setData((prev) => {
          const base = prev ?? emptyData
          return {
            ...base,
            currentQuestion:
              typeof d.currentQuestion === 'string' ? d.currentQuestion : base.currentQuestion,
            currentAnswer:
              typeof d.currentAnswer === 'string' ? d.currentAnswer : base.currentAnswer,
            isStreaming: Boolean(d.isStreaming),
            qaHistory: Array.isArray(d.qaHistory) ? d.qaHistory : base.qaHistory,
            credits: typeof d.credits === 'number' ? d.credits : base.credits,
            sessionActive: Boolean(d.sessionActive),
            isDesiMode: typeof d.isDesiMode === 'boolean' ? d.isDesiMode : base.isDesiMode,
            interviewType:
              typeof d.interviewType === 'string' ? d.interviewType : base.interviewType,
          }
        })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const themes = {
    dark: { bg: '#0a0a0f', card: '#16161f', text: '#f0f0f8', border: 'rgba(255,255,255,0.1)' },
    light: { bg: '#f8f9fa', card: '#ffffff', text: '#1a1a2e', border: 'rgba(0,0,0,0.1)' },
    minimal: { bg: 'rgba(0,0,0,0.85)', card: 'rgba(0,0,0,0.6)', text: '#ffffff', border: 'rgba(255,255,255,0.05)' },
  }

  const t = themes[theme]

  return (
    <div
      style={{
        background: t.bg,
        minHeight: '100vh',
        opacity: opacity / 100,
        padding: '12px',
        fontSize: `${fontSize}px`,
        color: t.text,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '8px',
          background: t.card,
          borderRadius: '10px',
          border: `1px solid ${t.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }} aria-hidden>
            🐦
          </span>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>InterviewAI</span>
          <span
            style={{
              background: '#43e97b22',
              color: '#43e97b',
              borderRadius: '100px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            INVISIBLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: '#8888aa' }}>Opacity</label>
          <input
            type="range"
            min={30}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ width: '60px', accentColor: '#6c63ff' }}
          />

          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(11, s - 1))}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              color: t.text,
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(20, s + 1))}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              color: t.text,
              borderRadius: '6px',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            +
          </button>

          <button
            type="button"
            onClick={() =>
              setTheme((th) => (th === 'dark' ? 'light' : th === 'light' ? 'minimal' : 'dark'))
            }
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              color: t.text,
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '👻'}
          </button>
        </div>
      </div>

      {data && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#f59e0b22',
              color: '#f59e0b',
              padding: '3px 10px',
              borderRadius: '100px',
              fontWeight: 600,
            }}
          >
            🪙 {data.credits} credits
          </span>
          <span
            style={{
              background: data.sessionActive ? '#43e97b22' : '#ff658422',
              color: data.sessionActive ? '#43e97b' : '#ff6584',
              padding: '3px 10px',
              borderRadius: '100px',
              fontWeight: 600,
            }}
          >
            {data.sessionActive ? '● Live' : '○ Paused'}
          </span>
          {data.isDesiMode && (
            <span
              style={{
                background: '#6c63ff22',
                color: '#a89dff',
                padding: '3px 10px',
                borderRadius: '100px',
                fontWeight: 600,
              }}
            >
              🇮🇳 Desi Mode
            </span>
          )}
        </div>
      )}

      {data?.currentQuestion ? (
        <div
          style={{
            background: t.card,
            border: '1px solid #6c63ff44',
            borderLeft: '3px solid #6c63ff',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#8888aa',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}
          >
            🎙️ Question Detected
          </div>
          <div style={{ lineHeight: 1.5 }}>{data.currentQuestion}</div>
        </div>
      ) : null}

      <div
        style={{
          background: t.card,
          border: '1px solid #43e97b44',
          borderLeft: '3px solid #43e97b',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '10px',
          minHeight: '120px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#43e97b',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}
          >
            🤖 AI Answer
          </div>
          {data?.isStreaming ? (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#43e97b',
                    animation: `overlayPulse 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ lineHeight: 1.7, color: data?.isStreaming ? '#43e97b' : t.text }}>
          {data?.currentAnswer ? (
            data.currentAnswer
          ) : (
            <span style={{ color: '#8888aa', fontStyle: 'italic' }}>
              Waiting for question… Speak naturally after starting session.
            </span>
          )}
        </div>
      </div>

      {data?.qaHistory && data.qaHistory.length > 0 ? (
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#8888aa',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            Recent Q&A
          </div>
          {data.qaHistory
            .slice(-3)
            .reverse()
            .map((qa, i) => (
              <div
                key={`${qa.question.slice(0, 40)}-${i}`}
                style={{
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '8px',
                  opacity: i === 0 ? 1 : 0.6,
                }}
              >
                <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px' }}>
                  Q: {qa.question}
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.5 }}>A: {qa.answer}</div>
              </div>
            ))}
        </div>
      ) : null}

      {!data && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8888aa' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }} aria-hidden>
            👻
          </div>
          <div style={{ fontWeight: 700, marginBottom: '8px', color: t.text }}>Invisible Mode Ready</div>
          <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
            This window is invisible to tab/window screen share.
            <br />
            Start your interview session in the main window.
            <br />
            AI answers will appear here automatically.
          </div>
        </div>
      )}

      <style>{`
        @keyframes overlayPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6c63ff; border-radius: 2px; }
      `}</style>
    </div>
  )
}
