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
} from "lucide-react"

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
  if (h < 12) return <Sun size={24} className="text-amber-400" />
  if (h < 18) return <Sunset size={24} className="text-orange-400" />
  return <Moon size={24} className="text-indigo-400" />
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
    <div className="rounded-2xl border border-white/8 bg-[#111827] p-5 flex flex-col gap-3 hover:border-[#F7931A]/20 transition-colors">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-[#94A3B8] mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function DownloadBanner() {
  return (
    <div
      className="rounded-2xl border border-[#F7931A]/25 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, rgba(247,147,26,0.08) 0%, rgba(17,24,39,1) 60%)' }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(247,147,26,0.12)' }}
      />

      <div className="relative p-6 flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)', boxShadow: '0 8px 24px rgba(247,147,26,0.35)' }}
        >
          <Monitor size={28} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">Download Desktop App</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30 uppercase tracking-wide">
              Windows
            </span>
          </div>
          <p className="text-[#94A3B8] text-sm mb-3">
            Get the full desktop experience — completely invisible to Zoom, Google Meet, and all screen recorders.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {[
              { icon: EyeOff, label: 'Invisible to screen share' },
              { icon: ShieldCheck, label: 'OS-level screen protection' },
              { icon: Zap, label: 'Always-on-top overlay' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Icon size={12} className="text-[#F7931A]" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Download button */}
        <a
          href="/downloads/InterviewAI-Setup.exe"
          download
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:scale-[1.03] hover:shadow-[0_0_24px_rgba(247,147,26,0.4)] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
        >
          <Download size={16} />
          Download .exe
        </a>
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
    {
      icon: Mic,
      label: 'Total Sessions',
      value: stats?.totalSessions ?? 0,
      color: '#F7931A',
      bg: 'rgba(247,147,26,0.12)',
    },
    {
      icon: Clock,
      label: 'Minutes Practiced',
      value: stats?.totalMinutes ?? 0,
      color: '#06B6D4',
      bg: 'rgba(6,182,212,0.12)',
    },
    {
      icon: Coins,
      label: 'Credits Remaining',
      value: creditsLoading ? '…' : balance,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: CalendarDays,
      label: 'Sessions This Week',
      value: stats?.sessionsThisWeek ?? 0,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
    },
  ]

  const quickActions = [
    {
      href: '/interview',
      icon: Mic,
      title: 'Start Interview Assistant',
      subtitle: 'Real-time AI answers',
      gradient: 'linear-gradient(135deg, #F7931A, #FF6B2B)',
      glow: 'rgba(247,147,26,0.3)',
    },
    {
      href: '/mock-interview',
      icon: Target,
      title: 'Practice Mock Interview',
      subtitle: 'Simulate the real thing',
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      glow: 'rgba(139,92,246,0.3)',
    },
    {
      href: '/resume-builder',
      icon: FileText,
      title: 'Build Your Resume',
      subtitle: 'ATS-optimized templates',
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.3)',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <GreetingIcon />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              {getGreeting(session?.user?.name)}
              <TrendingUp size={18} className="text-[#F7931A]" />
            </h1>
            <p className="text-[#94A3B8] text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Link
          href="/interview"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(247,147,26,0.35)] self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
        >
          <Zap size={16} />
          Start Session
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-[#111827] rounded-2xl border border-white/8 animate-pulse" />
            ))
          : statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-[#F7931A]" />
          Quick actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 overflow-hidden"
              style={{
                background: action.gradient,
                boxShadow: `0 8px 32px ${action.glow}`,
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <action.icon size={26} className="text-white" />
              </div>
              <p className="text-white font-bold text-base">{action.title}</p>
              <p className="text-white/70 text-xs mt-1">{action.subtitle}</p>
              <ChevronRight size={18} className="text-white/60 mt-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Download Desktop App */}
      <DownloadBanner />

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-[#94A3B8]" />
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
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 px-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-[#94A3B8] mb-4">
                <Inbox size={28} />
              </div>
              <h3 className="text-lg font-semibold text-[#D1D5DB] mb-2">No sessions yet</h3>
              <p className="text-[#94A3B8] text-sm max-w-xs mb-6">
                Start your first interview session to see activity here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/interview"
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
                >
                  Start Interview
                </Link>
                <Link
                  href="/mock-interview"
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-[#94A3B8] font-semibold text-sm hover:border-white/20 hover:text-white transition-colors"
                >
                  Try Mock Interview
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3 border-b border-white/5">
                  <tr>
                    {['Date', 'Duration', 'Mode', 'Credits Used', 'Questions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap"
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
                      className={`border-b border-white/4 hover:bg-white/2 transition-colors ${i === sessions.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-4 py-3 text-white text-sm whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] text-sm">
                        {Math.round(row.duration / 60)} min
                      </td>
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
          )}
        </div>
      </div>
    </div>
  )
}
