const testimonials = [
  {
    quote:
      'I cleared my system design round — the answers felt structured but not robotic. Game changer for nervous interviews.',
    name: 'Ananya Sharma',
    role: 'Senior SDE · Bangalore',
    gradient: 'linear-gradient(135deg, #6c63ff 0%, #ff6584 100%)',
  },
  {
    quote:
      'Desi Mode is actually how I explain things in real life. Finally an AI that doesn’t sound like a LinkedIn post.',
    name: 'Rahul Menon',
    role: 'Product Engineer · Remote',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #6c63ff 100%)',
  },
  {
    quote:
      'The overlay is subtle. I practiced with Meet running and my answers stayed private on my second monitor.',
    name: 'Priya Nair',
    role: 'Data Engineer · Hyderabad',
    gradient: 'linear-gradient(135deg, #ff6584 0%, #6c63ff 100%)',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
          Loved by{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
          >
            job seekers
          </span>
        </h2>
        <p className="text-center mb-14" style={{ color: '#8888aa' }}>
          Real stories from real interviews.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, gradient }) => (
            <div
              key={name}
              className="rounded-2xl border p-6 flex flex-col"
              style={{
                backgroundColor: '#16161f',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-lg" style={{ color: '#fbbf24' }}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-white leading-relaxed mb-6 flex-1">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full shrink-0"
                  style={{ backgroundImage: gradient }}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-xs" style={{ color: '#8888aa' }}>
                    {role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
