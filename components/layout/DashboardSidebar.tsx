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
    <aside
      className="hidden w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#0D1424] lg:flex"
      style={{ minHeight: '100vh' }}
    >
      <div className="p-6 border-b border-white/10">
        <Link
          href="/dashboard"
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, #2563EB, #0EA5E9)' }}
        >
          🐦 InterviewAI
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                active
                  ? 'border-l-4 border-[#2563EB] bg-[#2563EB]/10 text-white shadow-inner'
                  : 'text-[#94A3B8] hover:bg-[#111827] hover:text-white hover:border-l-4 hover:border-[#2563EB]/50'
              }`}
              style={{ borderLeft: '4px solid transparent' }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-4 bg-[#1E2A3A]">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <Coins size={16} />
            <span className="text-sm text-zinc-300">
              {isLoading ? '…' : balance}
            </span>
          </div>
        </div>
        {balance < 20 && (
          <Link
            href="/settings"
            className="block w-full rounded-lg bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] py-2.5 text-center text-sm font-semibold text-white hover:opacity-90 transition-all shadow-lg"
          >
            Upgrade Plan
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mt-3 block w-full rounded-lg border border-white/20 py-2.5 text-left text-sm font-medium text-[#94A3B8] hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

