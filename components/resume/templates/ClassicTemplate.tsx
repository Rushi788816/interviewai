import type { ResumeData } from '@/lib/resumeTypes'

export default function ClassicTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="bg-white p-8 text-black" style={{ fontFamily: 'Georgia, serif' }}>
      <h1 className="text-center text-3xl font-bold">{data.fullName || 'Your Name'}</h1>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-zinc-600">
        {[data.email, data.phone, data.location, data.linkedin, data.github].filter(Boolean).join(' · ')}
      </div>
      <hr className="my-6 border-black" />
      {data.summary && (
        <section className="mb-6">
          <h2 className="border-b border-black pb-1 text-lg font-bold">Summary</h2>
          <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="border-b border-black pb-1 text-lg font-bold">Experience</h2>
          {data.experience.map((e) => (
            <div key={e.id} className="mt-4 text-sm">
              <div className="flex justify-between font-bold">
                <span>{e.company}</span>
                <span className="font-normal text-zinc-600">
                  {e.start} – {e.current ? 'Present' : e.end}
                </span>
              </div>
              <div className="italic text-zinc-700">{e.title}</div>
              <p className="mt-1 whitespace-pre-wrap">{e.responsibilities}</p>
            </div>
          ))}
        </section>
      )}
      {data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="border-b border-black pb-1 text-lg font-bold">Education</h2>
          {data.education.map((ed) => (
            <div key={ed.id} className="mt-3 text-sm">
              <strong>{ed.institution}</strong> — {ed.degree} in {ed.field} ({ed.startYear}–{ed.endYear})
              {ed.gpa ? ` · GPA: ${ed.gpa}` : ''}
            </div>
          ))}
        </section>
      )}
      <section className="mb-6">
        <h2 className="border-b border-black pb-1 text-lg font-bold">Skills</h2>
        <p className="mt-2 text-sm">
          {[
            ...data.technicalSkills,
            ...data.softSkills,
            ...data.tools,
          ].join(', ')}
        </p>
      </section>
      {data.projects.length > 0 && (
        <section>
          <h2 className="border-b border-black pb-1 text-lg font-bold">Projects</h2>
          {data.projects.map((p) => (
            <div key={p.id} className="mt-3 text-sm">
              <strong>{p.name}</strong>
              <p className="whitespace-pre-wrap">{p.description}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
