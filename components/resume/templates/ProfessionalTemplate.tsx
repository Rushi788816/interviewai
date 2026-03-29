import type { ResumeData } from '@/lib/resumeTypes'

const NAVY = '#1a2a4a'
const NAVY_LIGHT = '#e8edf5'

export default function ProfessionalTemplate({ data }: { data: ResumeData }) {
  const contact = [data.email, data.phone, data.location, data.linkedin, data.github, data.portfolio]
    .filter(Boolean)

  // Split skills into 3 category boxes like Manasi's resume
  const skillGroups = [
    { label: 'Technical Skills', items: data.technicalSkills },
    { label: 'Tools & Technologies', items: data.tools },
    { label: 'Soft Skills', items: data.softSkills },
  ].filter(g => g.items.length > 0)

  return (
    <div
      id="resume-preview-inner"
      style={{
        background: '#fff',
        color: '#111',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        lineHeight: '1.55',
        padding: '36px 40px',
        minHeight: '842px',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: NAVY, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {data.fullName || 'Your Name'}
        </h1>
        {(data.experience[0]?.title || data.location) && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#444', fontWeight: '500' }}>
            {data.experience[0]?.title ?? ''}
            {data.experience[0]?.title && data.location ? ' | ' : ''}
            {data.location}
          </p>
        )}
        {contact.length > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>
            {contact.join(' | ')}
          </p>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: `2px solid ${NAVY}`, margin: '0 0 18px' }} />

      {/* ── Professional Summary ── */}
      {data.summary && (
        <section style={{ marginBottom: '18px' }}>
          <SectionHeader title="PROFESSIONAL SUMMARY" />
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#222', lineHeight: '1.6' }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* ── Technical Skills — 3-column grid boxes ── */}
      {skillGroups.length > 0 && (
        <section style={{ marginBottom: '18px' }}>
          <SectionHeader title="TECHNICAL SKILLS" />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(skillGroups.length, 3)}, 1fr)`, gap: '10px', marginTop: '10px' }}>
            {skillGroups.map(({ label, items }) => (
              <div
                key={label}
                style={{
                  border: `1px solid #c8d4e8`,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  background: NAVY_LIGHT,
                }}
              >
                <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '12px', color: NAVY }}>
                  {label}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {items.map((s) => (
                    <li key={s} style={{ fontSize: '11.5px', color: '#333', marginBottom: '3px', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                      <span style={{ color: NAVY, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>●</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Experience ── */}
      {data.experience.length > 0 && (
        <section style={{ marginBottom: '18px' }}>
          <SectionHeader title="EXPERIENCE" />
          {data.experience.map((e) => (
            <div key={e.id} style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#111' }}>
                  {e.title}
                  {e.title && e.company ? ' | ' : ''}
                  <span style={{ fontWeight: '700' }}>{e.company}</span>
                  {e.company && (data.location || e.start) ? ' | ' : ''}
                  {data.location}
                </span>
                <span style={{ fontSize: '11.5px', color: '#555', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                  {e.start}{(e.start && (e.end || e.current)) ? ' – ' : ''}{e.current ? 'Present' : e.end}
                </span>
              </div>
              {/* Responsibilities as bullet points */}
              <ul style={{ margin: '6px 0 0', padding: '0 0 0 0', listStyle: 'none' }}>
                {e.responsibilities
                  .split(/\n|(?<=\.)\s+/)
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', fontSize: '12.5px', color: '#222' }}>
                      <span style={{ color: NAVY, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>●</span>
                      <span>{line.replace(/^[•\-–—]\s*/, '')}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── Projects ── */}
      {data.projects.length > 0 && (
        <section style={{ marginBottom: '18px' }}>
          <SectionHeader title="PROJECTS" />
          {data.projects.map((p) => (
            <div key={p.id} style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#111' }}>{p.name}</span>
                {(p.liveUrl || p.githubUrl) && (
                  <span style={{ fontSize: '11px', color: '#555' }}>
                    {p.liveUrl || p.githubUrl}
                  </span>
                )}
              </div>
              {p.tech.length > 0 && (
                <p style={{ margin: '2px 0', fontSize: '11.5px', color: NAVY, fontStyle: 'italic' }}>
                  Tech: {p.tech.join(', ')}
                </p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#333', lineHeight: '1.55' }}>{p.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Education ── */}
      {data.education.length > 0 && (
        <section>
          <SectionHeader title="EDUCATION" />
          {data.education.map((ed) => (
            <div key={ed.id} style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#111' }}>
                  {ed.degree}{ed.degree && ed.field ? ' — ' : ''}{ed.field}
                  {ed.gpa ? <span style={{ fontWeight: 400, fontSize: '12px', color: '#555' }}> | {ed.gpa.includes('CGPA') || ed.gpa.includes('GPA') || ed.gpa.includes('%') ? '' : 'CGPA: '}{ed.gpa}</span> : ''}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#444' }}>{ed.institution}</p>
              </div>
              {(ed.startYear || ed.endYear) && (
                <span style={{ fontSize: '11.5px', color: '#555', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                  {ed.startYear}{ed.startYear && ed.endYear ? ' – ' : ''}{ed.endYear}
                </span>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: `2px solid ${NAVY}`, paddingBottom: '4px', marginBottom: '2px' }}>
      <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: NAVY, letterSpacing: '0.6px' }}>
        {title}
      </h2>
    </div>
  )
}
