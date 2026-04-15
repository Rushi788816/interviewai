'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { X, Menu } from 'lucide-react'

const eAPI = () => (typeof window !== 'undefined' ? (window as any).electronAPI : undefined)

const mobileNav = [
  { href: '/dashboard',      label: '🏠 Dashboard' },
  { href: '/interview',      label: '🎤 Interview Assistant' },
  { href: '/mock-interview', label: '🎯 Mock Interview' },
  { href: '/question-bank',  label: '📚 Question Bank' },
  { href: '/resume-builder', label: '📄 Resume Builder' },
  { href: '/tailor-resume',  label: '🪄 Tailor Resume' },
  { href: '/cover-letter',   label: '✉️ Cover Letter' },
  { href: '/credits',        label: '🪙 Buy Credits' },
  { href: '/settings',       label: '⚙️ Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(!!eAPI()?.isElectron)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      // In Electron: pass callbackUrl so after login user goes straight to /interview
      const cb = isElectron ? `?callbackUrl=${encodeURIComponent('/interview')}` : ''
      router.push(`/login${cb}`)
    }
  }, [status, router, isElectron])

  // In Electron: always stay on /interview — no other pages are accessible
  useEffect(() => {
    if (isElectron && status === 'authenticated' && pathname !== '/interview') {
      router.replace('/interview')
    }
  }, [isElectron, status, pathname, router])

  // Close mobile menu on route change + update page title
  useEffect(() => {
    setMenuOpen(false)
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard — InterviewAI',
      '/interview': 'Interview Assistant — InterviewAI',
      '/mock-interview': 'Mock Interview — InterviewAI',
      '/resume-builder': 'Resume Builder — InterviewAI',
      '/settings': 'Settings — InterviewAI',
    }
    document.title = titles[pathname] ?? 'InterviewAI'
  }, [pathname])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E]">
        <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

  // ── Electron overlay mode: no sidebar, frameless drag handle ───────────────
  if (isElectron) {
    const btnStyle: React.CSSProperties = {
      background: 'transparent', border: 'none', cursor: 'pointer',
      color: '#64748B', fontSize: '14px', lineHeight: 1, padding: '2px 6px',
      borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
    return (
      <div style={{ height: '100vh', background: '#0A0F1E', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>
        {/* Drag handle — invisible to screen recorders, draggable */}
        <div style={{
          height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', background: '#0A0F1E',
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
          // @ts-ignore — Electron-specific CSS
          WebkitAppRegion: 'drag',
        }}>
          <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 700, letterSpacing: '0.03em' }}>
            🐦 InterviewAI
          </span>
          {/* Window controls — must be no-drag so clicks register */}
          <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button title="Move left  Ctrl+Shift+←" onClick={() => eAPI()?.moveWindow('left')}  style={btnStyle}>◀</button>
            <button title="Move right Ctrl+Shift+→" onClick={() => eAPI()?.moveWindow('right')} style={btnStyle}>▶</button>
            <button title="Minimize" onClick={() => eAPI()?.minimizeWindow()} style={{ ...btnStyle, marginLeft: '6px' }}>─</button>
            <button title="Hide  Ctrl+Shift+H" onClick={() => eAPI()?.hideWindow()} style={{ ...btnStyle, color: '#f87171' }}>✕</button>
          </div>
        </div>
        {/* Page content fills remaining height */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E]">

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-white/10 bg-[#0A0F1E] px-4 py-3 sticky top-0 z-40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-bold"
        >
          <span>🐦</span>
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
          >
            InterviewAI
          </span>
        </Link>
        <button
          type="button"
          className="p-2 rounded-xl border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#6366F1]/30 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[53px] z-30 bg-[#0A0F1E]/95 backdrop-blur-sm">
          <nav className="flex flex-col gap-1 p-4">
            {mobileNav.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-4 py-3.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(99,102,241,0.10)' : 'transparent',
                    color: active ? '#6366F1' : '#D1D5DB',
                  }}
                >
                  {label}
                </Link>
              )
            })}
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-medium text-red-400 text-left border border-red-400/20 hover:bg-red-500/10 transition-all"
              >
                🚪 Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main layout */}
      <div className="flex min-h-[calc(100vh-53px)] lg:min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
