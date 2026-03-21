import type { ResumeData } from '@/lib/resumeTypes'

export default function ModernTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="flex min-h-[600px] bg-white text-black">
      <div className="w-[30%] bg-[#6c63ff] p-6 text-white">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/40 bg-white/20 text-2xl font-bold">
          {(data.fullName || 'Y')[0]}
        </div>
        <h1 className="text-center text-xl font-bold">{data.fullName || 'Name'}</h1>
        <p className="mt-4 text-xs leading-relaxed opacity-90">
          {[data.email, data.phone, data.location].filter(Boolean).join('\n')}
        </p>
        <h3 className="mt-6 font-semibold">Skills</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {[...data.technicalSkills, ...data.tools].map((s) => (
            <span key={s} className="rounded bg-white/20 px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="w-[70%] p-8">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#6c63ff]">Profile</h2>
            <p className="mt-2 text-sm">{data.summary}</p>
          </section>
        )}
        {data.experience.map((e) => (
          <div key={e.id} className="relative mb-4 border-l-2 border-violet-300 pl-4 text-sm">
            <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-violet-500" />
            <strong>{e.title}</strong> · {e.company}
            <p className="text-xs text-zinc-500">
              {e.start} – {e.current ? 'Present' : e.end}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{e.responsibilities}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
