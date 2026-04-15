const languages = [
  'English',
  'हिन्दी',
  'Español',
  '日本語',
  'Français',
  'Deutsch',
  'العربية',
  'বাংলা',
  '한국어',
  'Português',
  'Русский',
  'Italiano',
  'Türkçe',
  'मराठी',
  'தமிழ்',
]

function LangPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex px-4 py-2 mx-2 whitespace-nowrap rounded-full text-sm font-medium border"
      style={{
        backgroundColor: '#16161f',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        color: '#e8e8f0',
      }}
    >
      {label}
    </span>
  )
}

export default function LanguageMarquee() {
  const strip = (suffix: string) =>
    languages.map((lang) => <LangPill key={`${lang}-${suffix}`} label={lang} />)

  return (
    <section className="py-14 overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-2 px-4">
        Interview in Your Language —{' '}
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
        >
          52+ languages
        </span>
      </h2>
      <p className="text-center text-sm mb-10" style={{ color: '#8888aa' }}>
        Speak naturally; we transcribe and respond in context.
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
