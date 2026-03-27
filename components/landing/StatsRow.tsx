const stats = [
  { value: '10000+', label: 'Interviews' },
  { value: '5000+', label: 'Candidates' },
  { value: '52+', label: 'Languages' },
  { value: '55%', label: 'Cheaper' },
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
                  style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
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
