const platforms = [
  { emoji: '📹', name: 'Zoom' },
  { emoji: '🎥', name: 'Google Meet' },
  { emoji: '💬', name: 'MS Teams' },
  { emoji: '💻', name: 'LeetCode' },
  { emoji: '🏆', name: 'HackerRank' },
  { emoji: '📊', name: 'Superset' },
]

export default function PlatformsSection() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
          Works where you{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
          >
            already interview
          </span>
        </h2>
        <p className="text-center mb-12" style={{ color: '#8888aa' }}>
          Overlay stays private on your screen while you use your favorite tools.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map(({ emoji, name }) => (
            <div
              key={name}
              className="rounded-2xl border p-6 flex flex-col items-center justify-center gap-3 text-center transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: '#16161f',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="text-4xl" aria-hidden>
                {emoji}
              </span>
              <span className="font-semibold text-white">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
