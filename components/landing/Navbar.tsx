"use client"
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/compare', label: 'Compare' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.80)',
        borderColor: 'rgba(255, 255, 255, 0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl" aria-hidden>🐦</span>
          <span
            className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
          >
            InterviewAI
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#94A3B8] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#94A3B8] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundImage: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            Get Started →
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: 'rgba(10,10,15,0.98)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 space-y-2 border-t border-white/6 mt-3">
              <Link
                href="/login"
                className="block px-4 py-3 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors text-center border border-white/10"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-white text-center"
                style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
                onClick={() => setMobileOpen(false)}
              >
                Get Started Free →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
