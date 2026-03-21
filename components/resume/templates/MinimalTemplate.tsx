import type { ResumeData } from '@/lib/resumeTypes'

export default function MinimalTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white p-12 text-black">
      <h1 className="text-4xl font-light tracking-tight">{data.fullName || 'Name'}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {[data.email, data.phone, data.location].filter(Boolean).join(' · ')}
      </p>
      <hr className="my-8 border-zinc-200" />
      {data.summary && (
        <>
          <p className="text-sm leading-relaxed text-zinc-800">{data.summary}</p>
          <hr className="my-8 border-zinc-200" />
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Experience</h2>
          {data.experience.map((e) => (
            <div key={e.id} className="mt-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{e.title}</span>
                <span className="text-zinc-400">{e.start}–{e.current ? 'Now' : e.end}</span>
              </div>
              <div className="text-zinc-600">{e.company}</div>
              <p className="mt-2 whitespace-pre-wrap text-zinc-700">{e.responsibilities}</p>
            </div>
          ))}
          <hr className="my-8 border-zinc-200" />
        </>
      )}
      <p className="text-sm text-zinc-700">
        {[...data.technicalSkills, ...data.softSkills].join(' · ')}
      </p>
    </div>
  )
}
