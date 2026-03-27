import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0F1E] px-4 sm:px-5 pb-16 pt-24 sm:pt-28 text-center">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[600px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, rgba(247,147,26,0.20), transparent 70%)' }}
        />
      </div>

      {/* Live badge */}
      <div className="relative z-10 mb-7 animate-pulse">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(247,147,26,0.10)',
            borderColor: 'rgba(247,147,26,0.30)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: '#F7931A' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#F7931A' }} />
          </span>
          <span className="font-semibold text-xs sm:text-sm tracking-wide" style={{ color: '#F7931A' }}>
            REAL-TIME AI · INVISIBLE TO SCREEN SHARE
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-5xl mx-auto mb-7">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-5">
          Ace Every Interview with{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
          >
            AI on Your Side
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-[#94A3B8]">
          Real-time AI answers that listen to interview questions and give you private, personalized responses — completely invisible to your interviewer.
        </p>
      </div>

      {/* Social proof */}
      <div className="relative z-10 mb-8 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-lg" style={{ color: '#F7931A' }}>★</span>
          ))}
        </div>
        <span className="text-[#94A3B8] text-sm">Trusted by 5,000+ candidates at Google, Microsoft, Amazon & more</span>
      </div>

      {/* CTA buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 mb-14">
        <Link
          href="/signup"
          className="group px-8 sm:px-10 py-4 rounded-2xl font-bold text-white text-base sm:text-lg shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(247,147,26,0.45)] w-full sm:w-auto text-center"
          style={{
            backgroundImage: 'linear-gradient(135deg, #F7931A 0%, #FF6B2B 100%)',
            boxShadow: '0 10px 40px rgba(247,147,26,0.30)',
          }}
        >
          <span className="inline-flex items-center gap-2">
            ✨ Try for Free{' '}
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </span>
        </Link>
        <Link
          href="/pricing"
          className="px-8 py-4 rounded-2xl font-semibold text-sm text-[#94A3B8] border border-white/10 hover:border-[#F7931A]/30 hover:text-white transition-all w-full sm:w-auto text-center"
        >
          View Pricing →
        </Link>
      </div>

      <p className="relative z-10 text-xs text-[#64748B] -mt-10 mb-14">
        No credit card · 30 free credits on signup
      </p>

      {/* Product mock */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div
          className="rounded-3xl border p-5 sm:p-8 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: '#111827',
            borderColor: 'rgba(247,147,26,0.12)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(247,147,26,0.08)',
          }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-3 mb-6 pl-1">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
            </div>
            <div className="flex-1 h-px mx-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }} />
            <span
              className="text-xs sm:text-sm font-medium pr-2 bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
            >
              InterviewAI — Live Session
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Transcript panel */}
            <div
              className="rounded-2xl border p-5 text-left"
              style={{
                backgroundColor: 'rgba(247,147,26,0.04)',
                borderColor: 'rgba(247,147,26,0.12)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F7931A' }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Transcript (Live)
                </span>
              </div>
              <p className="text-white leading-relaxed text-sm sm:text-base">
                &ldquo;Can you walk me through how you would design a{' '}
                <span className="font-mono text-[#F7931A]">scalable notification system</span>{' '}
                for a social media platform?&rdquo;
              </p>
            </div>

            {/* AI answer panel */}
            <div
              className="rounded-2xl border p-5 text-left"
              style={{
                backgroundColor: 'rgba(67,233,123,0.04)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#43e97b' }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  AI Answer (Private)
                </span>
              </div>
              <div className="space-y-2 text-sm sm:text-base leading-relaxed text-[#e8e8f0]">
                <p>
                  I&apos;d start with a{' '}
                  <strong className="text-white">message queue (Kafka)</strong> for ingest, then fan-out workers writing to a per-user notification store. Push via WebSocket for real-time delivery, email as fallback…
                </p>
                <p className="inline-flex items-center gap-1 font-mono text-xs text-[#43e97b]">
                  <span className="animate-pulse">|</span> streaming
                </p>
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Listening
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A] animate-pulse" />
                Invisible Mode ON
              </span>
            </div>
            <span>1 credit/min · 30 credits free</span>
          </div>
        </div>
      </div>
    </section>
  )
}
