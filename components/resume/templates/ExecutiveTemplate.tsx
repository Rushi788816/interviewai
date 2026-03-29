import type { ResumeData } from '@/lib/resumeTypes'

export default function ExecutiveTemplate({ data }: { data: ResumeData }) {
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean)

  return (
    <div style={{ background: '#fff', fontFamily: 'Georgia, serif', fontSize: '13px', color: '#111', minHeight: '842px' }}>
      {/* Full-width dark header */}
      <div style={{ background: '#1e3a5f', padding: '32px 40px 28px', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {data.fullName || 'Your Name'}
        </h1>
        {data.experience[0]?.title && (
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#a8c4e0', fontStyle: 'italic', letterSpacing: '0.5px' }}>
            {data.experience[0].title}
          </p>
        )}
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {contact.map((c, i) => (
            <span key={i} style={{ fontSize: '11.5px', color: '#cde', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#7aaddb' }}>◆</span> {c}
            </span>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', minHeight: '700px' }}>
        {/* Left column — 32% */}
        <div style={{ width: '32%', background: '#f4f7fb', padding: '28px 22px', borderRight: '1px solid #dde4ef' }}>
          {/* Skills */}
          {data.technicalSkills.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <SideHeader title="CORE SKILLS" />
              {data.technicalSkills.map(s => <SkillDot key={s} label={s} />)}
            </div>
          )}
          {data.tools.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <SideHeader title="TOOLS" />
              {data.tools.map(s => <SkillDot key={s} label={s} />)}
            </div>
          )}
          {data.softSkills.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <SideHeader title="STRENGTHS" />
              {data.softSkills.map(s => <SkillDot key={s} label={s} />)}
            </div>
          )}
          {/* Education in sidebar */}
          {data.education.length > 0 && (
            <div>
              <SideHeader title="EDUCATION" />
              {data.education.map(ed => (
                <div key={ed.id} style={{ marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: '#1e3a5f' }}>
                    {ed.degree}
                  </p>
                  {ed.field && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>{ed.field}</p>}
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#777', fontStyle: 'italic' }}>{ed.institution}</p>
                  {(ed.startYear || ed.endYear) && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999' }}>{ed.startYear}–{ed.endYear}</p>
                  )}
                  {ed.gpa && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>GPA: {ed.gpa}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column — 68% */}
        <div style={{ flex: 1, padding: '28px 32px' }}>
          {data.summary && (
            <section style={{ marginBottom: '22px' }}>
              <MainHeader title="EXECUTIVE SUMMARY" />
              <p style={{ margin: '10px 0 0', fontSize: '12.5px', lineHeight: '1.7', color: '#333', fontStyle: 'italic' }}>
                {data.summary}
              </p>
            </section>
          )}
          {data.experience.length > 0 && (
            <section style={{ marginBottom: '22px' }}>
              <MainHeader title="PROFESSIONAL EXPERIENCE" />
              {data.experience.map(e => (
                <div key={e.id} style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a5f' }}>{e.title}</span>
                    <span style={{ fontSize: '11px', color: '#777', whiteSpace: 'nowrap' }}>
                      {e.start}{e.start ? ' – ' : ''}{e.current ? 'Present' : e.end}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 6px', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>{e.company}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {e.responsibilities.split(/\n|(?<=\.)\s+/).map(s => s.trim()).filter(Boolean).map((line, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: '#333', lineHeight: '1.55' }}>
                        <span style={{ color: '#1e3a5f', flexShrink: 0, marginTop: '3px' }}>▸</span>
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
              <MainHeader title="KEY PROJECTS" />
              {data.projects.map(p => (
                <div key={p.id} style={{ marginTop: '10px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a5f' }}>{p.name}</span>
                  {p.tech.length > 0 && <span style={{ fontSize: '11px', color: '#777', marginLeft: '8px', fontStyle: 'italic' }}>({p.tech.join(', ')})</span>}
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#444', lineHeight: '1.55' }}>{p.description}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function SideHeader({ title }: { title: string }) {
  return (
    <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '1.2px', color: '#1e3a5f', textTransform: 'uppercase', borderBottom: '1px solid #c4d0e8', paddingBottom: '4px' }}>
      {title}
    </p>
  )
}
function MainHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <h2 style={{ margin: 0, fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', color: '#1e3a5f', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</h2>
      <div style={{ flex: 1, height: '1px', background: '#1e3a5f', opacity: 0.3 }} />
    </div>
  )
}
function SkillDot({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1e3a5f', flexShrink: 0 }} />
      <span style={{ fontSize: '11.5px', color: '#333' }}>{label}</span>
    </div>
  )
}
