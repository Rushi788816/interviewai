'use client'

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import Skeleton from "@/components/shared/Skeleton"
import {
  Mic,
  Clock,
  Coins,
  CalendarDays,
  Zap,
  Target,
  FileText,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Inbox,
  Sun,
  Sunset,
  Moon,
} from "lucide-react"

interface SessionRow {
  id: string
  createdAt: string
  duration: number
  mode: string
  creditsUsed: number
  qaHistory: unknown
}

function greeting(name?: string | null) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${name?.split(' ')[0] || 'there'}!`
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
    return () => {
      cancelled = true
    }
  }, [])

  const qaCount = (row: SessionRow) => {
    try {
      const q = row.qaHistory as unknown[]
      return Array.isArray(q) ? q.length : 0
    } catch {
      return 0
    }
  }

  const IconCard = ({ icon: Icon, children, color }: { icon: any; children: React.ReactNode; color: string }) => (
    <div style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: `rgba(${color === "#2563EB" ? "37,99,235" : color === "#06B6D4" ? "6,182,212" : color === "#F59E0B" ? "245,158,11" : "139,92,246"},0.15)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color,
      marginBottom: "16px",
    }}>
      <Icon size={22} />
    </div>
  )

  const greetingIcon = () => {
    const h = new Date().getHours()
    if (h < 12) return <Sun size={28} />
    if (h < 18) return <Sunset size={28} />
    return <Moon size={28} />
  }

  return (
    <div className="max-w-6xl space-y-10 p-4 md:p-8">
      <div className="flex items-center gap-4">
        {greetingIcon()}
        <h1 className="text-2xl font-bold text-white md:text-3xl">{greeting(session?.user?.name)} <TrendingUp size={20} className="inline" /></h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton height="96px" />
            <Skeleton height="96px" />
            <Skeleton height="96px" />
            <Skeleton height="96px" />
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <IconCard icon={Mic} color="#2563EB" />
              <p className="text-sm text-[#94A3B8]">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{stats?.totalSessions ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <IconCard icon={Clock} color="#06B6D4" />
              <p className="text-sm text-[#94A3B8]">Minutes Practiced</p>
              <p className="text-2xl font-bold text-white">{stats?.totalMinutes ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <IconCard icon={Coins} color="#F59E0B" />
              <p className="text-sm text-[#94A3B8]">Credits Remaining</p>
              <p className="text-2xl font-bold text-white">{creditsLoading ? '…' : balance}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
              <IconCard icon={CalendarDays} color="#8B5CF6" />
              <p className="text-sm text-[#94A3B8]">Sessions This Week</p>
              <p className="text-2xl font-bold text-white">{stats?.sessionsThisWeek ?? 0}</p>
            </div>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/interview"
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              margin: "0 auto 16px",
            }}>
              <Mic size={28} />
            </div>
            Start Interview Assistant <ChevronRight size={16} className="inline group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/mock-interview"
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              margin: "0 auto 16px",
            }}>
              <Target size={28} />
            </div>
            Practice Mock Interview <ChevronRight size={16} className="inline group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/resume-builder"
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              margin: "0 auto 16px",
            }}>
              <FileText size={28} />
            </div>
            Build Resume <ChevronRight size={16} className="inline group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Sessions</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111827]">
          {loading ? (
            <div className="p-6 space-y-2">
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94A3B8",
                marginBottom: "16px",
              }}>
                <Inbox size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-zinc-300">No sessions yet</h3>
              <p className="text-[#94A3B8] mb-4 max-w-sm">Get started with a live interview or mock practice session.</p>
              <div className="flex gap-3">
                <Link href="/interview" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] font-semibold text-white hover:opacity-90">
                  Start Interview
                </Link>
                <Link href="/mock-interview" className="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent font-semibold text-[#94A3B8] hover:bg-white/10 hover:text-white">
                  Try Mock
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Date <MessageSquare size={12} className="inline ml-1" /></th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Credits Used</th>
                  <th className="px-4 py-3">Questions Answered</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{Math.round(row.duration / 60)} min</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs capitalize text-violet-200">
                        {row.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.creditsUsed}</td>
                    <td className="px-4 py-3">{qaCount(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

