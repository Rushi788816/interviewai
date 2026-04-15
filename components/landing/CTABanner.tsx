import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="py-20 px-4 sm:px-5 bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl border border-[#6366F1]/20 p-10 md:p-16 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)' }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#6366F1] text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse" />
              30 free credits on signup
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
              Ace your next interview.{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                Starting today.
              </span>
            </h2>

            <p className="text-[#94A3B8] text-base sm:text-lg mb-10 max-w-xl mx-auto">
              Start free — no credit card, no subscription trap. Upgrade when you need more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white w-full sm:w-auto transition-all hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.30)',
                }}
              >
                ✨ Get started free →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border w-full sm:w-auto transition-all hover:border-[#6366F1]/40 hover:text-white"
                style={{
                  color: '#94A3B8',
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                }}
              >
                View pricing →
              </Link>
            </div>

            <p className="text-[#4B5563] text-xs mt-6">
              No spam · No credit card · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
