'use client'

import { useCallback, useRef, useState } from 'react'
import type { SessionContext } from '@/types'
import { sanitizeReadableText } from '@/lib/sanitizeText'

const JD_MAX = 3000

const ROLE_CHIPS = [
  'SDE I', 'SDE II', 'Senior SDE', 'Frontend Dev', 'Backend Dev',
  'Fullstack Dev', 'DevOps', 'Data Analyst', 'ML Engineer', 'PM', 'QA Engineer',
] as const

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Resume section parser ────────────────────────────────────────────────────
interface ParsedResume {
  name: string
  contact: string[]
  summary: string
  skills: string[]
  experience: { title: string; company: string; period: string; bullets: string[] }[]
  projects: { name: string; bullets: string[] }[]
  education: string[]
  certifications: string[]
}

function parseResume(raw: string): ParsedResume {
  const lines = raw
    .split(/\n/)
    .map(l => l.trim())
    .filter(Boolean)

  const result: ParsedResume = {
    name: '', contact: [], summary: '', skills: [],
    experience: [], projects: [], education: [], certifications: [],
  }

  // Section heading detection
  const SECTION_RE = /^(professional summary|summary|technical skills?|skills?|technologies|work experience|experience|employment|projects?|personal projects?|education|academic|certifications?|continuous learning|courses?)/i

  type SectionKey = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'none'
  let currentSection: SectionKey = 'none'
  let currentExp: ParsedResume['experience'][0] | null = null
  let currentProj: ParsedResume['projects'][0] | null = null

  // First non-empty line is likely the name (all caps or title case, short)
  const firstLine = lines[0] ?? ''
  if (firstLine.length < 60 && /^[A-Z\s]+$/.test(firstLine)) {
    result.name = firstLine
  } else if (firstLine.length < 60) {
    result.name = firstLine
  }

  // Contact line: emails, phones, linkedin, github
  for (const line of lines.slice(0, 6)) {
    if (/[@+91|linkedin|github|portfolio]/i.test(line) || /\d{10}/.test(line)) {
      result.contact = line.split(/\s*[\|·•,]\s*/).map(s => s.trim()).filter(Boolean)
      break
    }
  }

  for (const line of lines) {
    const isHeading = SECTION_RE.test(line)

    if (isHeading) {
      // Save previous exp/proj before switching
      if (currentExp) { result.experience.push(currentExp); currentExp = null }
      if (currentProj) { result.projects.push(currentProj); currentProj = null }

      const lower = line.toLowerCase()
      if (/summary|objective|about/.test(lower)) currentSection = 'summary'
      else if (/skill|tech|technolog/.test(lower)) currentSection = 'skills'
      else if (/experience|employment/.test(lower)) currentSection = 'experience'
      else if (/project/.test(lower)) currentSection = 'projects'
      else if (/education|academic/.test(lower)) currentSection = 'education'
      else if (/certif|learning|course/.test(lower)) currentSection = 'certifications'
      continue
    }

    switch (currentSection) {
      case 'summary':
        if (result.summary.length < 400) result.summary += (result.summary ? ' ' : '') + line
        break

      case 'skills': {
        // Skills can be comma-separated or bullet-separated
        const cleaned = line.replace(/^[•\-–*]\s*/, '')
        // If it looks like a category label (e.g. "Frontend:"), skip it as a skill
        if (/^(frontend|backend|database|tools|workflow|languages?|frameworks?)[\s:]/i.test(cleaned)) break
        const chips = cleaned.split(/[,;•\|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40)
        result.skills.push(...chips)
        break
      }

      case 'experience': {
        const isBullet = /^[•\-–*]/.test(line)
        if (!isBullet) {
          // Looks like a job title / company line
          const isDateLine = /\d{4}|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(line)
          if (currentExp && isDateLine && !currentExp.period) {
            currentExp.period = line
          } else if (!isDateLine) {
            if (currentExp) result.experience.push(currentExp)
            currentExp = { title: line, company: '', period: '', bullets: [] }
          }
        } else if (currentExp) {
          currentExp.bullets.push(line.replace(/^[•\-–*]\s*/, ''))
        }
        break
      }

      case 'projects': {
        const isBullet = /^[•\-–*]/.test(line)
        if (!isBullet) {
          if (currentProj) result.projects.push(currentProj)
          // Project name is often "Name | Tech, Tech" — split on |
          const projName = line.split(/\s*\|\s*/)[0].trim()
          currentProj = { name: projName, bullets: [] }
        } else if (currentProj) {
          currentProj.bullets.push(line.replace(/^[•\-–*]\s*/, ''))
        }
        break
      }

      case 'education':
        result.education.push(line.replace(/^[•\-–*]\s*/, ''))
        break

      case 'certifications':
        result.certifications.push(line.replace(/^[•\-–*]\s*/, ''))
        break
    }
  }

  // Flush last exp / proj
  if (currentExp) result.experience.push(currentExp)
  if (currentProj) result.projects.push(currentProj)

  // Deduplicate skills
  result.skills = Array.from(new Set(result.skills.filter(s => s.length > 1)))

  return result
}

// ─── ParsedResumeCard ─────────────────────────────────────────────────────────
function ParsedResumeCard({
  parsed, rawText, onClear
}: { parsed: ParsedResume; rawText: string; onClear: () => void }) {
  const [showRaw, setShowRaw] = useState(false)

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#F7931A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      </div>
      {children}
    </div>
  )

  const Chip = ({ text }: { text: string }) => (
    <span style={{
      display: 'inline-block',
      background: 'rgba(247,147,26,0.1)',
      border: '1px solid rgba(247,147,26,0.25)',
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '12px',
      color: '#fbbf24',
      margin: '2px',
    }}>{text}</span>
  )

  return (
    <div style={{
      background: 'rgba(34,197,94,0.04)',
      border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(34,197,94,0.08)',
        borderBottom: '1px solid rgba(34,197,94,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>✅</span>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#4ade80' }}>
              Resume Parsed Successfully
            </p>
            {parsed.name && (
              <p style={{ margin: 0, fontSize: '11px', color: '#86efac' }}>{parsed.name}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#f87171',
            cursor: 'pointer',
          }}
        >
          Change
        </button>
      </div>

      {/* Parsed content */}
      <div style={{ padding: '16px', maxHeight: '340px', overflowY: 'auto' }}>

        {/* Contact */}
        {parsed.contact.length > 0 && (
          <Section title="Contact" icon="📬">
            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: '1.6' }}>
              {parsed.contact.join(' · ')}
            </p>
          </Section>
        )}

        {/* Summary */}
        {parsed.summary && (
          <Section title="Summary" icon="📝">
            <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: '1.65' }}>
              {parsed.summary.length > 200 ? parsed.summary.slice(0, 200) + '...' : parsed.summary}
            </p>
          </Section>
        )}

        {/* Skills */}
        {parsed.skills.length > 0 && (
          <Section title="Skills" icon="⚡">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
              {parsed.skills.slice(0, 20).map((s, i) => <Chip key={i} text={s} />)}
              {parsed.skills.length > 20 && (
                <span style={{ fontSize: '12px', color: '#64748B', padding: '4px 8px' }}>
                  +{parsed.skills.length - 20} more
                </span>
              )}
            </div>
          </Section>
        )}

        {/* Experience */}
        {parsed.experience.length > 0 && (
          <Section title="Experience" icon="💼">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {parsed.experience.slice(0, 3).map((exp, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                    {exp.title}
                  </p>
                  {exp.company && (
                    <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#F7931A' }}>{exp.company}</p>
                  )}
                  {exp.period && (
                    <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748B' }}>{exp.period}</p>
                  )}
                  {exp.bullets.slice(0, 2).map((b, j) => (
                    <p key={j} style={{ margin: '2px 0', fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
                      · {b.length > 100 ? b.slice(0, 100) + '…' : b}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {parsed.projects.length > 0 && (
          <Section title="Projects" icon="🚀">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parsed.projects.slice(0, 3).map((proj, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: '#E2E8F0' }}>
                    {proj.name}
                  </p>
                  {proj.bullets[0] && (
                    <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
                      · {proj.bullets[0].length > 100 ? proj.bullets[0].slice(0, 100) + '…' : proj.bullets[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {parsed.education.length > 0 && (
          <Section title="Education" icon="🎓">
            {parsed.education.slice(0, 3).map((edu, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#94A3B8' }}>· {edu}</p>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {parsed.certifications.length > 0 && (
          <Section title="Certifications" icon="🏅">
            {parsed.certifications.slice(0, 3).map((cert, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: '#94A3B8' }}>· {cert}</p>
            ))}
          </Section>
        )}

        {/* Raw text toggle */}
        <button
          type="button"
          onClick={() => setShowRaw(r => !r)}
          style={{
            background: 'none', border: 'none',
            color: '#475569', fontSize: '11px', cursor: 'pointer',
            textDecoration: 'underline', padding: 0, marginTop: '4px',
          }}
        >
          {showRaw ? 'Hide raw text' : 'View raw extracted text'}
        </button>
        {showRaw && (
          <pre style={{
            marginTop: '8px', padding: '10px', fontSize: '10px',
            color: '#64748B', background: 'rgba(0,0,0,0.3)',
            borderRadius: '6px', overflowX: 'auto', whiteSpace: 'pre-wrap',
            maxHeight: '180px', overflowY: 'auto',
          }}>
            {rawText.slice(0, 2000)}{rawText.length > 2000 ? '\n...(truncated)' : ''}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Main SetupScreen ─────────────────────────────────────────────────────────
interface SetupScreenProps {
  onComplete: (context: SessionContext) => void
  onSkip: () => void
  initialContext?: SessionContext | null
}

export default function SetupScreen({ onComplete, onSkip, initialContext }: SetupScreenProps) {
  const [step, setStep] = useState(1)
  const [jobRole, setJobRole] = useState(initialContext?.jobRole ?? '')
  const [jobDescription, setJobDescription] = useState(initialContext?.jobDescription ?? '')
  const [resumeText, setResumeText] = useState(initialContext?.resumeText ?? '')
  const [resumeFileName, setResumeFileName] = useState(initialContext?.resumeFileName ?? '')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(
    initialContext?.resumeText ? parseResume(initialContext.resumeText) : null
  )
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [resumeValidationError, setResumeValidationError] = useState('')
  const [pasteMode, setPasteMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const jdLen = jobDescription.length
  const progressPct = Math.round((step / 3) * 100)
  const hasResume = resumeText.trim().length > 50

  const handleFileUpload = useCallback(async (file: File) => {
    setResumeFile(file)
    setResumeFileName(file.name)
    setIsExtracting(true)
    setResumeText('')
    setParsedResume(null)
    setExtractionError('')
    setResumeValidationError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/extract-text', { method: 'POST', body: formData })
      const data = (await response.json()) as {
        text?: string; pages?: number; error?: string; note?: string; warning?: string
      }

      if (!response.ok) throw new Error(data.error || 'Extraction failed')

      if (data.text && data.text.trim().length > 50) {
        const clean = sanitizeReadableText(data.text, 8000)
        setResumeText(clean)
        setParsedResume(parseResume(clean))
        setExtractionError('')
      } else {
        setExtractionError(data.warning || 'Could not extract text from this PDF. Please paste your resume below.')
      }
    } catch (error) {
      console.error('File extraction error:', error)
      setExtractionError('Extraction failed. Please paste your resume text manually below.')
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFileUpload(file)
  }

  const handlePasteSubmit = () => {
    if (resumeText.trim().length > 50) {
      setParsedResume(parseResume(resumeText))
      setPasteMode(false)
      setResumeValidationError('')
    }
  }

  const handleClearResume = () => {
    setResumeText('')
    setParsedResume(null)
    setResumeFileName('')
    setResumeFile(null)
    setExtractionError('')
    setResumeValidationError('')
    setPasteMode(false)
  }

  const goNext = () => {
    if (step === 1) {
      if (!jobRole.trim()) return
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (!hasResume) {
        setResumeValidationError('Resume is required to get personalized AI answers. Please upload or paste your resume.')
        return
      }
      onComplete({
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.slice(0, JD_MAX),
        resumeText: sanitizeReadableText(resumeText, 8000),
        resumeFileName,
      })
    }
  }

  const goBack = () => { if (step > 1) setStep(s => s - 1) }

  const stepLabels = ['Role', 'Job Description', 'Resume'] as const

  const btnDisabled = step === 1 ? !jobRole.trim() : step === 3 ? (!hasResume || isExtracting) : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
        {stepLabels.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px', borderRadius: '50%', fontSize: '10px', fontWeight: '700',
                background: step === i + 1 ? '#F7931A' : step > i + 1 ? '#4ade80' : 'rgba(255,255,255,0.08)',
                color: step >= i + 1 ? '#000' : '#64748B',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span style={{
                color: step === i + 1 ? '#F7931A' : step > i + 1 ? '#4ade80' : 'rgba(255,255,255,0.35)',
                fontWeight: step === i + 1 ? '600' : '400',
              }}>
                {label}
                {label === 'Resume' && <span style={{ color: '#f87171', marginLeft: '2px' }}>*</span>}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '24px',
      }}>

        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '500' }}>
              What role are you interviewing for? <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && jobRole.trim() && goNext()}
              placeholder="e.g. Senior Software Engineer, Product Manager, Data Analyst"
              autoFocus
              style={{
                width: '100%', background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                padding: '12px 16px', color: '#fff', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(247,147,26,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ROLE_CHIPS.map(chip => (
                <button key={chip} type="button" onClick={() => setJobRole(chip)} style={{
                  background: jobRole === chip ? 'rgba(247,147,26,0.15)' : 'transparent',
                  border: `1px solid ${jobRole === chip ? 'rgba(247,147,26,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '20px', padding: '6px 14px', fontSize: '12px',
                  color: jobRole === chip ? '#F7931A' : '#94A3B8',
                  cursor: 'pointer', fontWeight: jobRole === chip ? '600' : '400', transition: 'all 0.15s',
                }}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Job Description ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <label style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '500' }}>
                Paste the Job Description
                <span style={{ color: '#64748B', fontWeight: '400', fontSize: '12px', marginLeft: '6px' }}>(optional but recommended)</span>
              </label>
              <button type="button" onClick={() => setStep(3)} style={{
                background: 'none', border: 'none', color: '#64748B',
                cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', flexShrink: 0,
              }}>Skip</button>
            </div>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value.slice(0, JD_MAX))}
              rows={8}
              placeholder="Paste the full job description here. AI will tailor answers to match exactly what the company is looking for..."
              style={{
                width: '100%', background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                padding: '12px 16px', color: '#fff', fontSize: '14px',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(247,147,26,0.5)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
              {jdLen} / {JD_MAX}
            </p>
          </div>
        )}

        {/* ── Step 3: Resume (required) ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#CBD5E1', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Upload Your Resume <span style={{ color: '#f87171' }}>*</span>
                <span style={{
                  background: 'rgba(247,147,26,0.12)', border: '1px solid rgba(247,147,26,0.3)',
                  borderRadius: '10px', padding: '2px 8px', fontSize: '11px', color: '#F7931A', fontWeight: '500',
                }}>Required</span>
              </label>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                AI uses your actual experience, projects & skills to give you personalized answers
              </p>
            </div>

            {/* Show parsed card if we have resume */}
            {parsedResume && hasResume ? (
              <ParsedResumeCard
                parsed={parsedResume}
                rawText={resumeText}
                onClear={handleClearResume}
              />
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) void handleFileUpload(f)
                    e.target.value = ''
                  }}
                />

                {/* Drop zone */}
                {!pasteMode && (
                  <button
                    type="button"
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    style={{
                      width: '100%',
                      background: isDragging ? 'rgba(247,147,26,0.08)' : 'rgba(247,147,26,0.03)',
                      border: `2px dashed ${isDragging ? 'rgba(247,147,26,0.6)' : 'rgba(247,147,26,0.25)'}`,
                      borderRadius: '12px', padding: '36px 20px',
                      textAlign: 'center', cursor: isExtracting ? 'wait' : 'pointer',
                      color: '#94A3B8', fontSize: '14px', transition: 'all 0.2s',
                      boxSizing: 'border-box',
                    }}
                  >
                    {isExtracting ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          display: 'inline-block', width: '24px', height: '24px',
                          border: '2px solid rgba(247,147,26,0.3)', borderTopColor: '#F7931A',
                          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                        }} />
                        <span style={{ color: '#F7931A', fontSize: '13px', fontWeight: '500' }}>
                          Extracting text from your resume...
                        </span>
                        {resumeFileName && (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{resumeFileName}</span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📄</div>
                        <div style={{ fontWeight: '600', color: '#CBD5E1', marginBottom: '4px' }}>
                          Drop your resume here or click to upload
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>.pdf or .txt · Max 10MB</div>
                      </>
                    )}
                  </button>
                )}

                {/* Extraction error */}
                {extractionError && !isExtracting && (
                  <div style={{
                    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
                    borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fbbf24',
                  }}>
                    ⚠️ {extractionError}
                  </div>
                )}

                {/* Paste option */}
                {!isExtracting && (
                  pasteMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#94A3B8' }}>Paste your resume text:</label>
                      <textarea
                        value={resumeText}
                        onChange={e => setResumeText(e.target.value)}
                        rows={8}
                        placeholder="Paste your full resume content here..."
                        autoFocus
                        style={{
                          width: '100%', background: '#0a0a0f',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                          padding: '12px 16px', color: '#fff', fontSize: '13px',
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(247,147,26,0.5)' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={handlePasteSubmit}
                          disabled={resumeText.trim().length < 50}
                          style={{
                            flex: 1, background: resumeText.trim().length < 50 ? 'rgba(247,147,26,0.2)' : 'linear-gradient(to right,#EA580C,#F7931A)',
                            border: 'none', borderRadius: '8px', padding: '9px',
                            color: 'white', fontSize: '13px', fontWeight: '600',
                            cursor: resumeText.trim().length < 50 ? 'not-allowed' : 'pointer',
                          }}>
                          Parse Resume →
                        </button>
                        <button type="button" onClick={() => { setPasteMode(false); setResumeText('') }}
                          style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '9px 16px',
                            color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
                          }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPasteMode(true)}
                      style={{
                        background: 'none', border: 'none', color: '#64748B',
                        cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0,
                      }}>
                      Prefer to paste resume text instead?
                    </button>
                  )
                )}
              </>
            )}

            {/* Validation error */}
            {resumeValidationError && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#f87171',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ⚠️ {resumeValidationError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={step === 1 ? onSkip : goBack}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '10px 20px',
            color: '#94A3B8', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          {step === 1 ? 'Skip Setup' : '← Back'}
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={btnDisabled}
          style={{
            background: btnDisabled ? 'rgba(247,147,26,0.25)' : 'linear-gradient(to right, #EA580C, #F7931A)',
            border: 'none', borderRadius: '10px',
            padding: step === 3 ? '11px 32px' : '10px 28px',
            color: 'white', fontSize: step === 3 ? '14px' : '13px',
            fontWeight: '700', cursor: btnDisabled ? 'not-allowed' : 'pointer',
            boxShadow: btnDisabled ? 'none' : '0 0 24px rgba(247,147,26,0.35)',
            opacity: btnDisabled ? 0.55 : 1, transition: 'all 0.2s',
          }}
        >
          {step === 3 ? (isExtracting ? 'Extracting...' : hasResume ? 'Start Interview →' : 'Upload Resume to Continue') : 'Next →'}
        </button>
      </div>

      {/* File info below button on step 3 */}
      {step === 3 && resumeFile && hasResume && (
        <p style={{ textAlign: 'center', margin: '-12px 0 0', fontSize: '11px', color: '#475569' }}>
          {resumeFileName} · {formatFileSize(resumeFile.size)}
        </p>
      )}

      {/* Progress bar */}
      <div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: 'linear-gradient(to right, #EA580C, #F7931A)',
            borderRadius: '4px', transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', margin: '6px 0 0' }}>
          {progressPct}% complete
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
