export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] px-5 pb-20 pt-28 text-center">
      <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(108, 99, 255, 0.25), transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 mb-8 animate-pulse">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(67, 233, 123, 0.12)',
            borderColor: 'rgba(67, 233, 123, 0.35)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: '#43e97b' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#43e97b' }} />
          </span>
          <span className="font-semibold text-sm tracking-wide" style={{ color: '#43e97b' }}>
            FULL CODING INTERVIEW SUPPORT
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto mb-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6">
          Real-Time AI Interview Assistant Completely{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)',
            }}
          >
            Invisible
          </span>{' '}
          to Interviewers
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#8888aa' }}>
          Listens to questions in real time and shows concise, private answers on your screen — designed to stay
          unnoticed on screen shares.
        </p>
      </div>

      <div className="relative z-10 mb-10 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-xl" style={{ color: '#fbbf24' }}>
              ★
            </span>
          ))}
        </div>
        <span style={{ color: '#8888aa' }} className="text-base">
          Used by 5000+ candidates
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 mb-16">
        <button
          type="button"
          className="group text-lg md:text-xl px-10 py-5 rounded-2xl font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(108,99,255,0.45)]"
          style={{
            backgroundImage: 'linear-gradient(135deg, #6c63ff 0%, #ff6584 100%)',
            boxShadow: '0 10px 40px rgba(108, 99, 255, 0.35)',
          }}
        >
          <span className="inline-flex items-center gap-2">
            ✨ TRY FOR FREE <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </button>
        <p className="text-sm" style={{ color: '#8888aa' }}>
          No Credit Card Required
        </p>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div
          className="rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: '#16161f',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex items-center gap-3 mb-6 pl-2">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
            </div>
            <div
              className="flex-1 h-px mx-4"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
            />
            <span
              className="text-sm font-medium pr-2 bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
            >
              InterviewAI — Live Session
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className="rounded-2xl border p-6 text-left"
              style={{
                backgroundColor: 'rgba(108, 99, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6c63ff' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8888aa' }}>
                  Transcript (Live)
                </span>
              </div>
              <p className="text-white leading-relaxed text-base md:text-lg">
                &ldquo;Can you walk me through how you would design a{' '}
                <span className="font-mono" style={{ color: '#6c63ff' }}>
                  scalable notification system
                </span>{' '}
                for a social media platform?&rdquo;
              </p>
            </div>

            <div
              className="rounded-2xl border p-6 text-left"
              style={{
                backgroundColor: 'rgba(67, 233, 123, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#43e97b' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8888aa' }}>
                  AI Answer (Private)
                </span>
              </div>
              <div className="space-y-2 text-base leading-relaxed" style={{ color: '#e8e8f0' }}>
                <p>
                  <span style={{ color: '#43e97b' }} className="font-mono text-xs uppercase tracking-wide">
                    streaming
                  </span>
                </p>
                <p>
                  Start with a{' '}
                  <strong className="text-white">high-level design</strong>: ingest events → message queue (Kafka) →
                  fan-out workers → per-user notification store + push/email…
                </p>
                <p className="inline-flex items-center gap-1 font-mono text-sm" style={{ color: '#43e97b' }}>
                  <span className="animate-pulse">|</span> streaming
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
