import Link from 'next/link'

export default function CTABanner() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-4xl mx-auto rounded-3xl border p-10 md:p-14 text-center overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(108, 99, 255, 0.35) 0%, rgba(255, 101, 132, 0.35) 50%, rgba(67, 233, 123, 0.15) 100%)',
          }}
        />
        <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(22, 22, 31, 0.85)' }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 px-2">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
            >
              Ace your next interview
            </span>
          </h2>
          <p className="mb-10 max-w-xl mx-auto" style={{ color: '#8888aa' }}>
            Start free — upgrade when you need more credits. No subscription trap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-white w-full sm:w-auto transition-opacity hover:opacity-90"
              style={{
                backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)',
                boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
              }}
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold border w-full sm:w-auto transition-colors hover:bg-white/5"
              style={{
                color: '#e8e8f0',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
