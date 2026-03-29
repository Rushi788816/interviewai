import type { ResumeData } from '@/lib/resumeTypes'

// Compact — maximises content on one page. Great for senior candidates.
// Orange left-border section accents, dense but readable layout.

const ORANGE = '#e65c00'

export default function CompactTemplate({ data }: { data: ResumeData }) {
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github, data.portfolio].filter(Boolean)

  return (
    <div style={{ background: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '12px', color: '#111', padding: '28px 36px', minHeight: '842px', lineHeight: '1.5' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111', letterSpacing: '0.3px' }}>
            {data.fullName || 'Your Name'}
          </h1>
          <div style={{ textAlign: 'right' }}>
            {contact.slice(0, 3).map((c, i) => (
              <p key={i} style={{ margin: '1px 0', fontSize: '11px', color: '#555' }}>{c}</p>
            ))}
          </div>
        </div>
        {contact.slice(3).length > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#777' }}>{contact.slice(3).join(' · ')}</p>
        )}
        <div style={{ height: '3px', background: `linear-gradient(to right, ${ORANGE}, #ff9800, transparent)`, marginTop: '10px', borderRadius: '2px' }} />
      </div>

      {/* Summary */}
      {data.summary && (
        <section style={{ marginBottom: '12px' }}>
          <SHeader title="SUMMARY" />
          <p style={{ margin: '5px 0 0', fontSize: '11.5px', color: '#333', lineHeight: '1.6' }}>{data.summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section style={{ marginBottom: '12px' }}>
          <SHeader title="EXPERIENCE" />
          {data.experience.map(e => (
            <div key={e.id} style={{ marginTop: '9px', paddingLeft: '10px', borderLeft: `3px solid ${ORANGE}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '12.5px' }}>{e.title} — {e.company}</span>
                <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
                  {e.start}{(e.start && (e.end || e.current)) ? ' – ' : ''}{e.current ? 'Present' : e.end}
                </span>
              </div>
              <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none' }}>
                {e.responsibilities.split(/\n|(?<=\.)\s+/).map(s => s.trim()).filter(Boolean).map((line, i) => (
                  <li key={i} style={{ display: 'flex', gap: '6px', marginBottom: '2px', fontSize: '11.5px', color: '#333', lineHeight: '1.5' }}>
                    <span style={{ color: ORANGE, flexShrink: 0, fontSize: '9px', marginTop: '4px' }}>■</span>
                    {line.replace(/^[•\-–—]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Two-column: Skills + Education */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
        {(data.technicalSkills.length > 0 || data.tools.length > 0 || data.softSkills.length > 0) && (
          <section>
            <SHeader title="SKILLS" />
            {data.technicalSkills.length > 0 && (
              <div style={{ marginTop: '5px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Technical: </span>
                <span style={{ fontSize: '11px', color: '#333' }}>{data.technicalSkills.join(', ')}</span>
              </div>
            )}
            {data.tools.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tools: </span>
                <span style={{ fontSize: '11px', color: '#333' }}>{data.tools.join(', ')}</span>
              </div>
            )}
            {data.softSkills.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soft: </span>
                <span style={{ fontSize: '11px', color: '#333' }}>{data.softSkills.join(', ')}</span>
              </div>
            )}
          </section>
        )}

        {data.education.length > 0 && (
          <section>
            <SHeader title="EDUCATION" />
            {data.education.map(ed => (
              <div key={ed.id} style={{ marginTop: '6px' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '12px' }}>{ed.degree}{ed.field ? ` — ${ed.field}` : ''}</p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#555' }}>{ed.institution}</p>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#777' }}>
                  {ed.startYear}{ed.startYear && ed.endYear ? '–' : ''}{ed.endYear}
                  {ed.gpa ? ` · GPA: ${ed.gpa}` : ''}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Projects */}
      {data.projects.length > 0 && (
        <section>
          <SHeader title="PROJECTS" />
          {data.projects.map(p => (
            <div key={p.id} style={{ marginTop: '7px', display: 'flex', gap: '8px' }}>
              <span style={{ color: ORANGE, fontWeight: '700', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>▸</span>
              <div>
                <span style={{ fontWeight: '700', fontSize: '12px' }}>{p.name}</span>
                {p.tech.length > 0 && <span style={{ fontSize: '11px', color: '#777', marginLeft: '6px', fontStyle: 'italic' }}>({p.tech.join(', ')})</span>}
                {(p.liveUrl || p.githubUrl) && <span style={{ fontSize: '10.5px', color: '#888', marginLeft: '6px' }}>{p.liveUrl || p.githubUrl}</span>}
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#444', lineHeight: '1.5' }}>{p.description}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function SHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
      <h2 style={{ margin: 0, fontSize: '10.5px', fontWeight: '800', letterSpacing: '1.2px', color: ORANGE, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</h2>
      <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
    </div>
  )
}
