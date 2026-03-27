import Link from 'next/link'

const features = [
  { icon: '⚡', title: 'Real-Time Answers', desc: 'Streamed AI responses as soon as the question lands.' },
  { icon: '💻', title: 'Full Coding Support', desc: 'System design, DSA, and take-home style prompts covered.' },
  { icon: '🌍', title: '52+ Languages', desc: 'Interview in the language you think in.' },
  { icon: '🇮🇳', title: 'Desi Mode', desc: 'Natural Indian English that sounds human, not rehearsed.' },
  { icon: '🪙', title: 'No Subscription', desc: 'Use credits when you need — no forced monthly lock-in.' },
]

export default function FeaturesGrid() {
  return (
    <section className="py-20 px-4 sm:px-5 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
            >
              answer with confidence
            </span>
          </h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto text-sm sm:text-base">
            Built for high-stakes rounds — from FAANG to fast-growing startups.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Hero card — Invisible Mode */}
          <div
            id="invisible-mode"
            className="rounded-2xl border p-6 transition-all hover:shadow-[0_0_24px_rgba(247,147,26,0.12)] hover:border-[#F7931A]/30 sm:col-span-2 lg:col-span-1"
            style={{
              backgroundColor: '#111827',
              borderColor: 'rgba(247,147,26,0.18)',
              boxShadow: '0 0 0 1px rgba(247,147,26,0.08)',
            }}
          >
            <div className="text-3xl mb-3" aria-hidden>👻</div>
            <h3 className="text-lg font-semibold text-white mb-2">Invisible to Interviewers</h3>
            <p className="text-sm leading-relaxed text-[#94A3B8] mb-4">
              Opens AI answers in a separate popup window. Share only your interview tab — the AI panel stays hidden from screen capture on Zoom, Meet, and Teams.
            </p>
            <Link
              href="/interview"
              className="text-sm font-semibold transition-colors"
              style={{ color: '#F7931A' }}
            >
              How it works →
            </Link>
          </div>

          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border p-6 transition-all hover:border-white/15 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              style={{
                backgroundColor: '#111827',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <div className="text-3xl mb-3" aria-hidden>{icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-[#94A3B8]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
