import type { ResumeData } from '@/lib/resumeTypes'

const TEAL = '#00897b'
const TEAL_LIGHT = '#e0f2f1'

export default function CreativeTemplate({ data }: { data: ResumeData }) {
  const allSkills = [...data.technicalSkills, ...data.tools]
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github].filter(Boolean)

  return (
    <div style={{ display: 'flex', background: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '13px', color: '#222', minHeight: '842px' }}>
      {/* Left sidebar */}
      <div style={{ width: '34%', background: TEAL, padding: '36px 20px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Avatar circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', marginBottom: '12px' }}>
            {(data.fullName || 'Y')[0].toUpperCase()}
          </div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', lineHeight: '1.2', letterSpacing: '0.5px' }}>
            {data.fullName || 'Your Name'}
          </h1>
          {data.experience[0]?.title && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
              {data.experience[0].title}
            </p>
          )}
        </div>

        {/* Contact */}
        <div>
          <SLabel>CONTACT</SLabel>
          {contact.map((c, i) => (
            <p key={i} style={{ margin: '4px 0', fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4', wordBreak: 'break-all' }}>{c}</p>
          ))}
        </div>

        {/* Skills as pill tags */}
        {allSkills.length > 0 && (
          <div>
            <SLabel>SKILLS</SLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
              {allSkills.map(s => (
                <span key={s} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '2px 9px', fontSize: '10.5px', color: '#fff' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Soft skills */}
        {data.softSkills.length > 0 && (
          <div>
            <SLabel>STRENGTHS</SLabel>
            {data.softSkills.map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div>
            <SLabel>EDUCATION</SLabel>
            {data.education.map(ed => (
              <div key={ed.id} style={{ marginBottom: '10px' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '11.5px' }}>{ed.degree}</p>
                {ed.field && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{ed.field}</p>}
                <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>{ed.institution}</p>
                {(ed.startYear || ed.endYear) && <p style={{ margin: '1px 0 0', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>{ed.startYear}–{ed.endYear}</p>}
                {ed.gpa && <p style={{ margin: '1px 0 0', fontSize: '10.5px', color: 'rgba(255,255,255,0.7)' }}>GPA: {ed.gpa}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right main content */}
      <div style={{ flex: 1, padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {data.summary && (
          <section>
            <MHeader title="ABOUT ME" />
            <p style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.7', color: '#444' }}>{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section>
            <MHeader title="EXPERIENCE" />
            {data.experience.map((e, idx) => (
              <div key={e.id} style={{ marginTop: idx === 0 ? '10px' : '14px', paddingLeft: '14px', borderLeft: `3px solid ${TEAL_LIGHT}`, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '-5px', top: '4px', width: '7px', height: '7px', borderRadius: '50%', background: TEAL }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#111' }}>{e.title}</span>
                  <span style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                    {e.start}{e.start ? ' – ' : ''}{e.current ? 'Present' : e.end}
                  </span>
                </div>
                <p style={{ margin: '2px 0 6px', fontSize: '12px', color: TEAL, fontWeight: '600' }}>{e.company}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {e.responsibilities.split(/\n|(?<=\.)\s+/).map(s => s.trim()).filter(Boolean).map((line, i) => (
                    <li key={i} style={{ display: 'flex', gap: '7px', marginBottom: '3px', fontSize: '12px', color: '#444', lineHeight: '1.5' }}>
                      <span style={{ color: TEAL, flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>●</span>
                      {line.replace(/^[•\-–—]\s*/, '')}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {data.projects.length > 0 && (
          <section>
            <MHeader title="PROJECTS" />
            <div style={{ display: 'grid', gridTemplateColumns: data.projects.length > 1 ? '1fr 1fr' : '1fr', gap: '10px', marginTop: '10px' }}>
              {data.projects.map(p => (
                <div key={p.id} style={{ border: `1px solid ${TEAL_LIGHT}`, borderRadius: '8px', padding: '12px', background: '#fafffe' }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '12.5px', color: '#111' }}>{p.name}</p>
                  {p.tech.length > 0 && (
                    <p style={{ margin: '3px 0 5px', fontSize: '10.5px', color: TEAL, fontStyle: 'italic' }}>{p.tech.join(' · ')}</p>
                  )}
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#555', lineHeight: '1.5' }}>{p.description}</p>
                  {(p.liveUrl || p.githubUrl) && (
                    <p style={{ margin: '5px 0 0', fontSize: '10.5px', color: '#777' }}>{p.liveUrl || p.githubUrl}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 6px', fontSize: '9.5px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
      {children}
    </p>
  )
}
function MHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <h2 style={{ margin: 0, fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: TEAL, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</h2>
      <div style={{ flex: 1, height: '2px', background: TEAL_LIGHT }} />
    </div>
  )
}
