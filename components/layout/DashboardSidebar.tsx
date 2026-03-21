'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCredits } from '@/hooks/useCredits'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/interview', label: 'Interview Assistant', icon: '🎤' },
  { href: '/mock-interview', label: 'Mock Interview', icon: '🎯' },
  { href: '/resume-builder', label: 'Resume Builder', icon: '📄' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { balance, isLoading } = useCredits()

  return (
    <aside
      className="hidden w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#111118] lg:flex"
      style={{ minHeight: '100vh' }}
    >
      <div className="p-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
        >
          🐦 InterviewAI
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? 'border-l-4 border-violet-500 bg-violet-500/10 text-white'
                  : 'text-zinc-400 hover:bg-[#1c1c27] hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <span className="text-sm text-zinc-300">
            🪙 {isLoading ? '…' : balance}
          </span>
        </div>
        {balance < 20 && (
          <Link
            href="/settings"
            className="block w-full rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] py-2 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            Upgrade
          </Link>
        )}
      </div>
    </aside>
  )
}
