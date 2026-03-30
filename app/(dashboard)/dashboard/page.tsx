'use client'

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import {
  Mic,
  Clock,
  Coins,
  CalendarDays,
  Target,
  FileText,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Inbox,
  Sun,
  Sunset,
  Moon,
  Zap,
  Download,
  Monitor,
  ShieldCheck,
  EyeOff,
  Sparkles,
  BookOpen,
  Mail,
} from "lucide-react"
import LowCreditBanner from "@/components/ui/LowCreditBanner"

interface SessionRow {
  id: string
  createdAt: string
  duration: number
  mode: string
  creditsUsed: number
  qaHistory: unknown
}

function getGreeting(name?: string | null) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${name?.split(' ')[0] || 'there'}!`
}

function GreetingIcon() {
  const h = new Date().getHours()
  if (h < 12) return <Sun size={22} className="text-amber-400" />
  if (h < 18) return <Sunset size={22} className="text-orange-400" />
  return <Moon size={22} className="text-indigo-400" />
}

function StatCard({
  icon: Icon,
  color,
  bg,
  label,
  value,
}: {
  icon: React.ElementType
  color: string
  bg: string
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#111827] p-4 flex flex-col gap-2.5 hover:border-white/15 transition-all duration-200">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xs text-[#64748B] mb-0.5 leading-tight">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-white leading-none">{value}</p>
      </div>
    </div>
  )
}

function DownloadBanner() {
  return (
    <div
      className="rounded-2xl border border-[#F7931A]/20 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, rgba(247,147,26,0.06) 0%, rgba(17,24,39,1) 70%)' }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(247,147,26,0.10)' }}
      />
      <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)', boxShadow: '0 6px 20px rgba(247,147,26,0.3)' }}
        >
          <Monitor size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-white">Download Desktop App</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30 uppercase tracking-wide">
              Windows &amp; macOS
            </span>
          </div>
          <p className="text-[#94A3B8] text-xs sm:text-sm mb-2">
            Completely invisible to Zoom, Google Meet, and all screen recorders.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { icon: EyeOff, label: 'Invisible to screen share' },
              { icon: ShieldCheck, label: 'OS-level protection' },
              { icon: Zap, label: 'Always-on-top overlay' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                <Icon size={11} className="text-[#F7931A]" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
          <a
            href="https://github.com/Rushi788816/interviewai/releases/download/v1.0.0/InterviewAI-Setup.exe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(247,147,26,0.35)] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            <Download size={15} />
            Windows (.exe)
          </a>
          <a
            href="https://github.com/Rushi788816/interviewai/releases/download/v1.0.0/InterviewAI.dmg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.98] border border-white/20 bg-white/5 hover:bg-white/10"
          >
            <Download size={15} />
            macOS (.dmg)
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { balance, isLoading: creditsLoading } = useCredits()
  const [stats, setStats] = useState<{
    totalSessions: number
    totalMinutes: number
    creditsRemaining: number
    sessionsThisWeek: number
  } | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [sRes, rRes] = await Promise.all([
          fetch('/api/sessions/stats'),
          fetch('/api/sessions/recent?limit=10'),
        ])
        if (sRes.ok) {
          const s = await sRes.json()
          if (!cancelled) setStats(s)
        }
        if (rRes.ok) {
          const r = await rRes.json()
          if (!cancelled) setSessions(r.sessions || [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const qaCount = (row: SessionRow) => {
    try {
      const q = row.qaHistory as unknown[]
      return Array.isArray(q) ? q.length : 0
    } catch {
      return 0
    }
  }

  const statCards = [
    { icon: Mic,         label: 'Total Sessions',     value: stats?.totalSessions ?? 0,    color: '#F7931A', bg: 'rgba(247,147,26,0.12)' },
    { icon: Clock,       label: 'Minutes Practiced',  value: stats?.totalMinutes ?? 0,     color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
    { icon: Coins,       label: 'Credits Left',       value: creditsLoading ? '…' : balance, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { icon: CalendarDays,label: 'This Week',          value: stats?.sessionsThisWeek ?? 0, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  ]

  const quickActions = [
    {
      href: '/interview',
      icon: Mic,
      title: 'Interview Assistant',
      subtitle: 'Real-time AI answers streamed to your screen',
      badge: 'LIVE',
      features: ['Technical', 'Behavioral', 'Coding', '50+ languages'],
      gradient: 'linear-gradient(135deg, #F7931A, #FF6B2B)',
      glow: 'rgba(247,147,26,0.35)',
      border: 'rgba(247,147,26,0.2)',
    },
    {
      href: '/mock-interview',
      icon: Target,
      title: 'Mock Interview',
      subtitle: 'Simulate a real interview with instant AI feedback',
      features: ['5 AI questions', 'Score on clarity', 'Better answers'],
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      glow: 'rgba(139,92,246,0.35)',
      border: 'rgba(139,92,246,0.2)',
    },
    {
      href: '/resume-builder',
      icon: FileText,
      title: 'Resume Builder',
      subtitle: 'ATS-optimized resume with AI enhancement',
      features: ['8 templates', 'AI enhance', 'PDF export', 'ATS score'],
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.2)',
    },
    {
      href: '/question-bank',
      icon: BookOpen,
      title: 'Question Bank',
      subtitle: 'Personalized questions with ideal answers',
      features: ['Behavioral', 'Technical', 'HR', 'Coding'],
      gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
      glow: 'rgba(6,182,212,0.35)',
      border: 'rgba(6,182,212,0.2)',
    },
    {
      href: '/cover-letter',
      icon: Mail,
      title: 'Cover Letter',
      subtitle: 'AI-written cover letter from your resume',
      features: ['3 tones', 'JD-tailored', 'Ready to send'],
      gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
      glow: 'rgba(236,72,153,0.35)',
      border: 'rgba(236,72,153,0.2)',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* ── Low credit banner ── */}
      <LowCreditBanner />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <GreetingIcon />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              {getGreeting(session?.user?.name)}
              <TrendingUp size={16} className="text-[#F7931A]" />
            </h1>
            <p className="text-[#64748B] text-xs sm:text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Link
          href="/interview"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
        >
          <Zap size={14} />
          Start Session
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#111827] rounded-2xl border border-white/8 animate-pulse" />
            ))
          : statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-[#F7931A]" />
          <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
        </div>

        <div className="grid gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex items-center gap-4 rounded-2xl border bg-[#111827] p-4 sm:p-5 transition-all duration-200 hover:bg-[#141e2e] hover:-translate-y-0.5 overflow-hidden"
              style={{ borderColor: action.border }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 0% 50%, ${action.glow}20 0%, transparent 55%)` }}
              />

              {/* Icon */}
              <div
                className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: action.gradient, boxShadow: `0 4px 16px ${action.glow}` }}
              >
                <action.icon size={20} className="text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-white font-bold text-sm sm:text-base leading-tight">{action.title}</span>
                  {'badge' in action && action.badge && (
                    <span
                      className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white tracking-wide"
                      style={{ background: action.gradient }}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className="text-[#64748B] text-xs sm:text-sm leading-snug">{action.subtitle}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {action.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full border text-[#64748B]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={17}
                className="relative text-[#4B5563] group-hover:text-white group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Download Banner ── */}
      <DownloadBanner />

      {/* ── Recent Sessions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare size={15} className="text-[#64748B]" />
            Recent Sessions
          </h2>
          {sessions.length > 0 && (
            <Link href="/settings" className="text-xs text-[#F7931A] hover:underline">
              View all →
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#4B5563] mb-4">
                <Inbox size={24} />
              </div>
              <h3 className="text-base font-semibold text-[#D1D5DB] mb-2">No sessions yet</h3>
              <p className="text-[#64748B] text-sm max-w-xs mb-5">
                Start your first session to see your activity here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/interview"
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white text-center"
                  style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
                >
                  Start Interview
                </Link>
                <Link
                  href="/mock-interview"
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-[#94A3B8] font-semibold text-sm hover:border-white/20 hover:text-white transition-colors text-center"
                >
                  Try Mock Interview
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr>
                      {['Date', 'Duration', 'Mode', 'Credits', 'Questions'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-white/4 hover:bg-white/2 transition-colors cursor-pointer ${i === sessions.length - 1 ? 'border-b-0' : ''}`}
                        onClick={() => window.location.href = `/sessions/${row.id}`}
                      >
                        <td className="px-4 py-3 text-white text-sm whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-sm">{Math.round(row.duration / 60)} min</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20">
                            {row.mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-sm">
                          <span className="flex items-center gap-1.5">
                            <Coins size={12} className="text-amber-400" />
                            {row.creditsUsed}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-sm">{qaCount(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-white/5">
                {sessions.map((row) => (
                  <div key={row.id} className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/2 transition-colors" onClick={() => window.location.href = `/sessions/${row.id}`}>
                    <div className="w-9 h-9 rounded-xl bg-[#F7931A]/10 flex items-center justify-center flex-shrink-0">
                      <Mic size={15} className="text-[#F7931A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20 font-medium">
                          {row.mode}
                        </span>
                        <span className="text-xs text-[#64748B]">{qaCount(row)} questions</span>
                      </div>
                      <p className="text-[#64748B] text-xs mt-0.5">
                        {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}{Math.round(row.duration / 60)} min
                        {' · '}<span className="text-amber-400">🪙 {row.creditsUsed}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
