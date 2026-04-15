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
  BookOpen,
  Mail,
  Wand2,
  ShieldCheck,
} from "lucide-react"

const nav = [
  { href: '/dashboard',      label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/interview',      label: 'Interview Assistant',  icon: Mic },
  { href: '/mock-interview', label: 'Mock Interview',       icon: Target },
  { href: '/question-bank',  label: 'Question Bank',        icon: BookOpen },
  { href: '/resume-builder', label: 'Resume Builder',       icon: FileText },
  { href: '/tailor-resume',  label: 'Tailor Resume',        icon: Wand2 },
  { href: '/cover-letter',   label: 'Cover Letter',         icon: Mail },
  { href: '/ats-score',      label: 'ATS Score',            icon: ShieldCheck },
  { href: '/credits',        label: 'Buy Credits',          icon: Coins },
  { href: '/settings',       label: 'Settings',             icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { balance, isLoading } = useCredits()

  return (
    <aside aria-label="Sidebar navigation" className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#0A0F1E]" style={{ minHeight: '100vh' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-bold"
        >
          <span className="text-xl">🐦</span>
          <span className="text-white">
            Interview<span style={{ color: '#6366F1' }}>AI</span>
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col gap-1 px-3 py-5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all relative"
              style={{
                backgroundColor: active ? 'rgba(99,102,241,0.10)' : 'transparent',
                color: active ? '#6366F1' : '#94A3B8',
                fontWeight: active ? '600' : '400',
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: '#6366F1' }}
                />
              )}
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom credits + signout */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {/* Credits pill */}
        <div className="flex items-center justify-between rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/8 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-indigo-400" />
            <span className="text-sm text-white font-semibold">
              {isLoading ? '…' : balance}
            </span>
            <span className="text-xs text-[#94A3B8]">credits</span>
          </div>
        </div>

        {balance < 20 && (
          <Link
            href="/credits"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <Zap size={13} />
            Get More Credits
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 w-full rounded-xl border border-white/10 py-2.5 px-3 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
