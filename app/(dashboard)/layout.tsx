'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-zinc-400">
        Loading…
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <Link
          href="/dashboard"
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
        >
          🐦 InterviewAI
        </Link>
        <button
          type="button"
          className="rounded-lg border border-white/10 px-3 py-2 text-white"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      {menuOpen && (
        <div className="border-b border-white/10 bg-[#111118] px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-2">
            {[
              ['/dashboard', '🏠 Dashboard'],
              ['/interview', '🎤 Interview Assistant'],
              ['/mock-interview', '🎯 Mock Interview'],
              ['/resume-builder', '📄 Resume Builder'],
              ['/settings', '⚙️ Settings'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-[#1c1c27]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <div className="flex min-h-[calc(100vh-52px)] lg:min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
