const stats = [
  { value: '52+', label: 'Languages Supported' },
  { value: '30', label: 'Free Credits on Signup' },
  { value: '3', label: 'Interview Modes' },
  { value: '100%', label: 'Private & Secure' },
]

export default function StatsRow() {
  return (
    <section className="py-16 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-2xl border p-8 md:p-10"
          style={{
            backgroundColor: '#16161f',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p
                  className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent mb-2"
                  style={{ backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  {value}
                </p>
                <p className="text-sm font-medium" style={{ color: '#8888aa' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
