export default function DesiModeSection() {
  return (
    <section className="py-20 px-5" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-3">
          Sound like{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}
          >
            you
          </span>
          , not a brochure
        </h2>
        <p className="text-center max-w-2xl mx-auto mb-12" style={{ color: '#8888aa' }}>
          Desi Mode keeps answers natural for Indian workplaces — conversational tone, relatable examples, zero
          corporate stiffness.
        </p>

        <p
          className="text-center text-lg font-medium mb-10 px-4"
          style={{ color: '#e8e8f0' }}
        >
          &ldquo;Tell me about a conflict in your team.&rdquo;
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div
            className="rounded-2xl border p-6 md:p-8"
            style={{
              backgroundColor: 'rgba(255, 101, 132, 0.08)',
              borderColor: 'rgba(255, 101, 132, 0.25)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#EF4444' }}>
              Generic AI
            </p>
            <p className="leading-relaxed text-sm md:text-base" style={{ color: '#c8c8dd' }}>
              I leveraged cross-functional synergies to align stakeholders and drive consensus through structured
              dialogue, ensuring optimal conflict resolution frameworks were operationalized across the matrix
              organization to enhance stakeholder satisfaction metrics.
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 md:p-8"
            style={{
              backgroundColor: 'rgba(67, 233, 123, 0.08)',
              borderColor: 'rgba(67, 233, 123, 0.28)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#43e97b' }}>
              Desi Mode 🇮🇳
            </p>
            <p className="leading-relaxed text-sm md:text-base" style={{ color: '#e8e8f0' }}>
              So basically two of us disagreed on the API timeline — I set up a quick sync, heard both sides, and we
              split the work: I took the integration, my teammate owned tests. Shipped in a week without drama.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
