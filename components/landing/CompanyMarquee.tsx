const companies = [
  { emoji: '🔍', name: 'Google' },
  { emoji: '🪟', name: 'Microsoft' },
  { emoji: '📘', name: 'Facebook' },
  { emoji: '🎬', name: 'Netflix' },
  { emoji: '💼', name: 'LinkedIn' },
  { emoji: '💳', name: 'PayPal' },
  { emoji: '🖥️', name: 'IBM' },
  { emoji: '🍃', name: 'MongoDB' },
  { emoji: '🐦', name: 'Twitter' },
  { emoji: '📦', name: 'Amazon' },
]

function CompanyPill({ emoji, name }: { emoji: string; name: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-6 py-2 mx-3 whitespace-nowrap rounded-full text-sm font-medium border"
      style={{
        backgroundColor: '#16161f',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        color: '#8888aa',
      }}
    >
      <span>{emoji}</span>
      <span className="text-white">{name}</span>
    </span>
  )
}

export default function CompanyMarquee() {
  const strip = (suffix: string) =>
    companies.map(({ emoji, name }) => (
      <CompanyPill key={`${name}-${suffix}`} emoji={emoji} name={name} />
    ))

  return (
    <section className="py-10 overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      <p className="text-center text-sm mb-6 uppercase tracking-widest" style={{ color: '#8888aa' }}>
        Trusted by candidates interviewing at
      </p>
      <div className="relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused]">
          <div className="flex shrink-0 items-center">{strip('a')}</div>
          <div className="flex shrink-0 items-center" aria-hidden>
            {strip('b')}
          </div>
        </div>
      </div>
    </section>
  )
}
