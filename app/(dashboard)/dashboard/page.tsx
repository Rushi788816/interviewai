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

  const IconCard = ({ icon: Icon, color }: { icon: any; color: string }) => (
    <div style={{
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.15)`,
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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        {greetingIcon()}
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white' }}>
          {greeting(session?.user?.name)} <TrendingUp size={20} style={{ display: 'inline', marginLeft: '8px' }} />
        </h1>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr)' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '96px', backgroundColor: '#1E2A3A', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}></div>
          ))
        ) : (
          <>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827', padding: '20px' }}>
              <IconCard icon={Mic} color="#2563EB" />
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px' }}>Total Sessions</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.totalSessions ?? 0}</p>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827', padding: '20px' }}>
              <IconCard icon={Clock} color="#06B6D4" />
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px' }}>Minutes Practiced</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.totalMinutes ?? 0}</p>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827', padding: '20px' }}>
              <IconCard icon={Coins} color="#F59E0B" />
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px' }}>Credits Remaining</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{creditsLoading ? '…' : balance}</p>
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827', padding: '20px' }}>
              <IconCard icon={CalendarDays} color="#8B5CF6" />
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px' }}>Sessions This Week</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats?.sessionsThisWeek ?? 0}</p>
            </div>
          </>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '16px' }}>Quick actions</h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr)' }}>
          <Link
            href="/interview"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              padding: '32px 24px',
              color: 'white',
              fontWeight: '600',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Mic size={28} />
            </div>
            <div>Start Interview Assistant</div>
            <ChevronRight size={20} style={{ marginTop: '8px', transition: 'transform 0.2s' }} />
          </Link>
          <Link
            href="/mock-interview"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
              padding: '32px 24px',
              color: 'white',
              fontWeight: '600',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Target size={28} />
            </div>
            <div>Practice Mock Interview</div>
            <ChevronRight size={20} style={{ marginTop: '8px', transition: 'transform 0.2s' }} />
          </Link>
          <Link
            href="/resume-builder"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              padding: '32px 24px',
              color: 'white',
              fontWeight: '600',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <FileText size={28} />
            </div>
            <div>Build Resume</div>
            <ChevronRight size={20} style={{ marginTop: '8px', transition: 'transform 0.2s' }} />
          </Link>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '16px' }}>Recent Sessions</h2>
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111827' }}>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '48px', backgroundColor: '#1E2A3A', borderRadius: '8px' }}></div>
              <div style={{ height: '48px', backgroundColor: '#1E2A3A', borderRadius: '8px' }}></div>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                marginBottom: '16px',
              }}>
                <Inbox size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#D1D5DB', marginBottom: '8px' }}>No sessions yet</h3>
              <p style={{ color: '#94A3B8', maxWidth: '400px' }}>Get started with a live interview or mock practice session.</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Link href="/interview" style={{ padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', color: 'white', fontWeight: '600', textDecoration: 'none' }}>
                  Start Interview
                </Link>
                <Link href="/mock-interview" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', color: '#94A3B8', fontWeight: '600', textDecoration: 'none', backgroundColor: 'transparent' }}>
                  Try Mock
                </Link>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Date <MessageSquare size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>Duration</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mode</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>Credits Used</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', color: '#94A3B8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>Questions Answered</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: 'white' }}>
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{Math.round(row.duration / 60)} min</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '9999px', 
                        backgroundColor: 'rgba(139,92,246,0.2)', 
                        color: 'rgb(168,85,247)', 
                        fontSize: '0.75rem', 
                        fontWeight: '500' 
                      }}>
                        {row.mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{row.creditsUsed}</td>
                    <td style={{ padding: '12px 16px' }}>{qaCount(row)}</td>
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

