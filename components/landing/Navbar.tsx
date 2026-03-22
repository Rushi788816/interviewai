import Link from 'next/link'

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 md:px-8 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.75)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          🐦
        </span>
        <Link
          href="/"
          className="inline-block text-xl font-bold tracking-tight bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(90deg, #2563EB, #0EA5E9)',
          }}
        >
          InterviewAI
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/blog"
          className="text-sm transition-colors hover:text-white"
          style={{ color: '#94A3B8' }}
        >
          Blog
        </Link>
        <Link
          href="/compare"
          className="text-sm transition-colors hover:text-white"
          style={{ color: '#94A3B8' }}
        >
          Compare
        </Link>
        <Link
          href="/pricing"
          className="text-sm transition-colors hover:text-white"
          style={{ color: '#94A3B8' }}
        >
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
          title="Coming Soon"
          style={{
            color: '#94A3B8',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            backgroundColor: 'transparent',
          }}
        >
          Desktop App
        </button>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            backgroundImage: 'linear-gradient(90deg, #2563EB, #0EA5E9)',
          }}
        >
          Sign in →
        </Link>
      </div>
    </nav>
  )
}
