import Link from 'next/link'

const features = [
  { icon: '⚡', title: 'Real-Time Answers', desc: 'Streamed responses as soon as the question lands.' },
  { icon: '💻', title: 'Full Coding Support', desc: 'System design, DSA, and take-home style prompts covered.' },
  { icon: '🌍', title: '52+ Languages', desc: 'Interview in the language you think in.' },
  { icon: '🇮🇳', title: 'Desi Mode', desc: 'Natural Indian English that sounds human, not rehearsed.' },
  { icon: '📊', title: 'No Subscription', desc: 'Use credits when you need — no forced monthly lock-in.' },
]

export default function FeaturesGrid() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
          Everything you need to{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
          >
            answer with confidence
          </span>
        </h2>
        <p className="text-center mb-14 max-w-2xl mx-auto" style={{ color: '#8888aa' }}>
          Built for high-stakes rounds — from FAANG to fast-growing startups.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            id="invisible-mode"
            className="rounded-2xl border p-6 transition-shadow hover:shadow-lg"
            style={{
              backgroundColor: '#16161f',
              borderColor: 'rgba(108, 99, 255, 0.25)',
              boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.12)',
            }}
          >
            <div className="text-3xl mb-3" aria-hidden>
              👻
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Invisible to Interviewers</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#8888aa' }}>
              Opens AI answers in a separate popup window. Share only your interview tab — the AI panel stays hidden
              from screen capture on Zoom, Meet, and Teams.
            </p>
            <Link
              href="/interview#invisible-mode"
              className="text-sm font-semibold text-[#a89dff] hover:text-[#c4b8ff] hover:underline"
            >
              How it works →
            </Link>
          </div>

          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border p-6 transition-shadow hover:shadow-lg"
              style={{
                backgroundColor: '#16161f',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: '0 0 0 1px rgba(108, 99, 255, 0.06)',
              }}
            >
              <div className="text-3xl mb-3" aria-hidden>
                {icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8888aa' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
