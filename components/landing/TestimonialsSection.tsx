const testimonials = [
  {
    quote:
      'I cleared my system design round — the answers felt structured but not robotic. Game changer for nervous interviews.',
    name: 'Ananya Sharma',
    role: 'Senior SDE · Bangalore',
    gradient: 'linear-gradient(135deg, #F7931A 0%, #FF6B2B 100%)',
  },
  {
    quote:
      'Desi Mode is actually how I explain things in real life. Finally an AI that doesn\'t sound like a LinkedIn post.',
    name: 'Rahul Menon',
    role: 'Product Engineer · Remote',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #F7931A 100%)',
  },
  {
    quote:
      'The overlay is subtle. I practiced with Meet running and my answers stayed private on my second monitor.',
    name: 'Priya Nair',
    role: 'Data Engineer · Hyderabad',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #F7931A 100%)',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-5 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Loved by{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
            >
              job seekers
            </span>
          </h2>
          <p className="text-[#94A3B8]">Real stories from real interviews.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map(({ quote, name, role, gradient }) => (
            <div
              key={name}
              className="rounded-2xl border p-6 flex flex-col transition-all hover:border-white/15 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              style={{
                backgroundColor: '#111827',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-base" style={{ color: '#F7931A' }}>★</span>
                ))}
              </div>
              <p className="text-white leading-relaxed text-sm mb-6 flex-1">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full shrink-0"
                  style={{ backgroundImage: gradient }}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-xs text-[#94A3B8]">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
