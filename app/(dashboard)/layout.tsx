'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { X, Menu } from 'lucide-react'

const mobileNav = [
  { href: '/dashboard',      label: '🏠 Dashboard' },
  { href: '/interview',      label: '🎤 Interview Assistant' },
  { href: '/mock-interview', label: '🎯 Mock Interview' },
  { href: '/question-bank',  label: '📚 Question Bank' },
  { href: '/resume-builder', label: '📄 Resume Builder' },
  { href: '/cover-letter',   label: '✉️ Cover Letter' },
  { href: '/credits',        label: '🪙 Buy Credits' },
  { href: '/settings',       label: '⚙️ Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

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
        <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

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
            style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
          >
            InterviewAI
          </span>
        </Link>
        <button
          type="button"
          className="p-2 rounded-xl border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#F7931A]/30 transition-colors"
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
                    backgroundColor: active ? 'rgba(247,147,26,0.10)' : 'transparent',
                    color: active ? '#F7931A' : '#D1D5DB',
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
