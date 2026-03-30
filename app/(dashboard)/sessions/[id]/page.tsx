'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, Clock, Coins, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface QA {
  question: string
  answer: string
}

interface SessionDetail {
  id: string
  createdAt: string
  duration: number
  creditsUsed: number
  mode: string
  jobRole: string | null
  isDesiMode: boolean
  language: string
  qaHistory: QA[]
  transcript: unknown[]
}

function QACard({ qa, index }: { qa: QA; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const parts = qa.answer.split(' | ')

  return (
    <div className="rounded-xl border border-white/8 bg-[#111827] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center text-[11px] font-bold text-[#F7931A]">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-[#E2E8F0] font-medium leading-snug">{qa.question}</span>
        {open ? <ChevronUp size={15} className="text-zinc-500 flex-shrink-0 mt-0.5" /> : <ChevronDown size={15} className="text-zinc-500 flex-shrink-0 mt-0.5" />}
      </button>

      {open && (
        <div className="border-t border-white/6 p-4 pt-3 space-y-2">
          {parts.length === 3 ? (
            <>
              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-3">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">SAY THIS</p>
                <p className="text-sm text-[#E2E8F0] leading-relaxed">{parts[0].trim()}</p>
              </div>
              <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">DETAIL</p>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">{parts[1].trim()}</p>
              </div>
              <div className="rounded-lg bg-orange-500/8 border border-orange-500/20 p-3">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">EXAMPLE / RESULT</p>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">{parts[2].trim()}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{qa.answer}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionReplayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/sessions/detail?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setSession(data as SessionDetail)
      })
      .catch(() => setError('Failed to load session'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-[#94A3B8]">{error || 'Session not found'}</p>
        <Link href="/dashboard" className="text-[#F7931A] text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  )

  const qaList: QA[] = Array.isArray(session.qaHistory) ? session.qaHistory : []
  const date = new Date(session.createdAt)
  const mins = Math.floor(session.duration / 60)
  const secs = session.duration % 60

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[#94A3B8] hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Session Replay</h1>
          <p className="text-[#64748B] text-sm mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          {session.jobRole && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F7931A]/10 border border-[#F7931A]/25 text-[#F7931A]">
              {session.jobRole}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#94A3B8] flex items-center gap-1.5">
            <Clock size={11} /> {mins}m {secs}s
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#94A3B8] flex items-center gap-1.5">
            <MessageSquare size={11} /> {qaList.length} Q&amp;As
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#94A3B8] flex items-center gap-1.5">
            <Coins size={11} /> {session.creditsUsed} credits
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#94A3B8]">
            {session.mode}
          </span>
          {session.isDesiMode && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 border border-orange-500/25 text-orange-400">
              Desi Mode 🇮🇳
            </span>
          )}
        </div>

        {/* Q&A list */}
        {qaList.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-[#111827] p-10 text-center">
            <Mic size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">No Q&amp;A recorded in this session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">
              {qaList.length} Question{qaList.length !== 1 ? 's' : ''} answered
            </p>
            {qaList.map((qa, i) => (
              <QACard key={i} qa={qa} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            <Mic size={14} />
            Start New Session
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] border border-white/10 hover:text-white hover:border-white/20 transition-all"
          >
            View All Sessions
          </Link>
        </div>

      </div>
    </div>
  )
}
