'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCredits } from '@/hooks/useCredits'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Mic,
  Target,
  FileText,
  Settings,
  Coins,
  LogOut,
  Zap,
} from "lucide-react"

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/interview', label: 'Interview Assistant', icon: Mic },
  { href: '/mock-interview', label: 'Mock Interview', icon: Target },
  { href: '/resume-builder', label: 'Resume Builder', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { balance, isLoading } = useCredits()

  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/8 bg-[#0A0F1E]" style={{ minHeight: '100vh' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-bold"
        >
          <span className="text-xl">🐦</span>
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
          >
            InterviewAI
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all relative"
              style={{
                backgroundColor: active ? 'rgba(247,147,26,0.10)' : 'transparent',
                color: active ? '#F7931A' : '#94A3B8',
                fontWeight: active ? '600' : '400',
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: '#F7931A' }}
                />
              )}
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom credits + signout */}
      <div className="border-t border-white/8 p-4 space-y-3">
        {/* Credits pill */}
        <div className="flex items-center justify-between rounded-xl border border-[#F7931A]/20 bg-[#F7931A]/8 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-amber-400" />
            <span className="text-sm text-white font-semibold">
              {isLoading ? '…' : balance}
            </span>
            <span className="text-xs text-[#94A3B8]">credits</span>
          </div>
        </div>

        {balance < 20 && (
          <Link
            href="/settings"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            <Zap size={13} />
            Get More Credits
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 w-full rounded-xl border border-white/8 py-2.5 px-3 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
