'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCredits } from '@/hooks/useCredits'
import Skeleton from '@/components/shared/Skeleton'

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
  return `${part}, ${name?.split(' ')[0] || 'there'}! 👋`
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

  return (
    <div className="max-w-6xl space-y-10">
      <h1 className="text-2xl font-bold text-white md:text-3xl">{greeting(session?.user?.name)}</h1>

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
            <div className="rounded-2xl border border-white/10 bg-[#16161f] p-5">
              <div className="text-2xl mb-1">🎤</div>
              <p className="text-sm text-zinc-400">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{stats?.totalSessions ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#16161f] p-5">
              <div className="text-2xl mb-1">⏱️</div>
              <p className="text-sm text-zinc-400">Minutes Used</p>
              <p className="text-2xl font-bold text-white">{stats?.totalMinutes ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#16161f] p-5">
              <div className="text-2xl mb-1">🪙</div>
              <p className="text-sm text-zinc-400">Credits Remaining</p>
              <p className="text-2xl font-bold text-white">{creditsLoading ? '…' : balance}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#16161f] p-5">
              <div className="text-2xl mb-1">📅</div>
              <p className="text-sm text-zinc-400">Sessions This Week</p>
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
className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            Start Interview
          </Link>
          <Link
            href="/mock-interview"
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            Practice Mock
          </Link>
          <Link
            href="/resume-builder"
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center font-semibold text-white transition hover:opacity-90"
          >
            Build Resume
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Sessions</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#16161f]">
          {loading ? (
            <div className="p-6 space-y-2">
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">No sessions yet</p>
          ) : (
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Credits Used</th>
                  <th className="px-4 py-3">Questions Answered</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
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
