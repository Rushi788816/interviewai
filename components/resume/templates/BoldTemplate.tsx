import type { ResumeData } from '@/lib/resumeTypes'

// Bold — strong typography, numbered sections, dark accents. Contemporary & eye-catching.

const DARK = '#0f172a'
const ACCENT = '#f59e0b'

export default function BoldTemplate({ data }: { data: ResumeData }) {
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github, data.portfolio].filter(Boolean)

  return (
    <div style={{ background: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif', color: DARK, minHeight: '842px' }}>
      {/* Header — bold name with accent underline bar */}
      <div style={{ padding: '36px 40px 24px', borderBottom: `4px solid ${ACCENT}` }}>
        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '900', color: DARK, letterSpacing: '-0.5px', lineHeight: '1', textTransform: 'uppercase' }}>
          {data.fullName || 'YOUR NAME'}
        </h1>
        {data.experience[0]?.title && (
          <p style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: '600', color: ACCENT, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {data.experience[0].title}
          </p>
        )}
        {contact.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {contact.map((c, i) => (
              <span key={i} style={{ fontSize: '11.5px', color: '#555', borderLeft: i > 0 ? '1px solid #ddd' : 'none', paddingLeft: i > 0 ? '12px' : '0' }}>{c}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.summary && (
          <section>
            <Num n={1} title="PROFILE" />
            <p style={{ margin: '10px 0 0 48px', fontSize: '12.5px', lineHeight: '1.7', color: '#333' }}>{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <Num n={2} title="EXPERIENCE" />
            <div style={{ marginLeft: '48px' }}>
              {data.experience.map((e, idx) => (
                <div key={e.id} style={{ marginTop: idx === 0 ? '10px' : '16px', paddingBottom: '16px', borderBottom: idx < data.experience.length - 1 ? '1px dashed #e5e7eb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: DARK }}>{e.title}</span>
                    <span style={{ fontSize: '11.5px', background: ACCENT, color: '#fff', padding: '1px 8px', borderRadius: '20px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {e.start}{(e.start && (e.end || e.current)) ? ' – ' : ''}{e.current ? 'Present' : e.end}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 8px', fontSize: '12px', fontWeight: '600', color: ACCENT }}>{e.company}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {e.responsibilities.split(/\n|(?<=\.)\s+/).map(s => s.trim()).filter(Boolean).map((line, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: '#444', lineHeight: '1.55' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: DARK, color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', fontWeight: '700' }}>
                          {i + 1}
                        </span>
                        {line.replace(/^[•\-–—]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(data.technicalSkills.length > 0 || data.tools.length > 0 || data.softSkills.length > 0) && (
          <section>
            <Num n={3} title="SKILLS" />
            <div style={{ marginLeft: '48px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.technicalSkills.length > 0 && (
                <SkillRow label="Technical" items={data.technicalSkills} />
              )}
              {data.tools.length > 0 && (
                <SkillRow label="Tools" items={data.tools} />
              )}
              {data.softSkills.length > 0 && (
                <SkillRow label="Soft Skills" items={data.softSkills} />
              )}
            </div>
          </section>
        )}

        {data.education.length > 0 && (
          <section>
            <Num n={4} title="EDUCATION" />
            <div style={{ marginLeft: '48px', marginTop: '10px', display: 'grid', gridTemplateColumns: data.education.length > 1 ? '1fr 1fr' : '1fr', gap: '12px' }}>
              {data.education.map(ed => (
                <div key={ed.id} style={{ border: `2px solid ${DARK}`, borderRadius: '8px', padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '12.5px', color: DARK }}>{ed.degree}</p>
                  {ed.field && <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#555' }}>{ed.field}</p>}
                  <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: '600', color: ACCENT }}>{ed.institution}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#777' }}>
                    {ed.startYear}{ed.startYear && ed.endYear ? '–' : ''}{ed.endYear}
                    {ed.gpa ? ` · GPA: ${ed.gpa}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects.length > 0 && (
          <section>
            <Num n={5} title="PROJECTS" />
            <div style={{ marginLeft: '48px', marginTop: '10px', display: 'grid', gridTemplateColumns: data.projects.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
              {data.projects.map(p => (
                <div key={p.id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', borderTop: `3px solid ${ACCENT}` }}>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '12.5px', color: DARK }}>{p.name}</p>
                  {p.tech.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '5px 0' }}>
                      {p.tech.map(t => (
                        <span key={t} style={{ fontSize: '10px', background: DARK, color: '#fff', padding: '1px 7px', borderRadius: '4px', fontWeight: '600' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#555', lineHeight: '1.55' }}>{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Num({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900', flexShrink: 0 }}>
        {String(n).padStart(2, '0')}
      </span>
      <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '900', letterSpacing: '2px', color: DARK, textTransform: 'uppercase' }}>{title}</h2>
      <div style={{ flex: 1, height: '2px', background: '#f1f5f9' }} />
    </div>
  )
}

function SkillRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#fff', background: DARK, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '1px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {items.map(s => (
          <span key={s} style={{ fontSize: '11.5px', background: '#f1f5f9', color: '#334155', padding: '2px 9px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{s}</span>
        ))}
      </div>
    </div>
  )
}
