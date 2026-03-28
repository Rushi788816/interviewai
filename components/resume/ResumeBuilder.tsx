'use client'

import { useState } from 'react'
import type { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry } from '@/lib/resumeTypes'
import { useToast } from '@/hooks/useToast'

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const inputClass =
  'bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]'

function SkillTags({
  label,
  tags,
  input,
  onInput,
  onAdd,
  onRemove,
}: {
  label: string
  tags: string[]
  input: string
  onInput: (v: string) => void
  onAdd: () => void
  onRemove: (t: string) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-sm">
            {t}
            <button type="button" className="text-zinc-500 hover:text-white" onClick={() => onRemove(t)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className={inputClass}
        placeholder="Type and press Enter"
        value={input}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onAdd()
          }
        }}
      />
    </div>
  )
}

export default function ResumeBuilder({
  data,
  onChange,
  step,
  onStepChange,
}: {
  data: ResumeData
  onChange: (d: ResumeData) => void
  step: number
  onStepChange: (n: number) => void
}) {
  const addToast = useToast((s) => s.addToast)

  const enhance = async (section: string, content: string, jobTitle: string, apply: (t: string) => void) => {
    try {
      const res = await fetch('/api/ai/resume-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enhance', section, content, jobTitle }),
      })
      const j = await res.json()
      if (!res.ok) {
        addToast(j.error || 'Enhance failed', 'error')
        return
      }
      apply(j.enhanced || '')
      addToast('Enhanced', 'success')
    } catch {
      addToast('Enhance failed', 'error')
    }
  }

  const set = (patch: Partial<ResumeData>) => onChange({ ...data, ...patch })

  const addExp = () =>
    set({
      experience: [
        ...data.experience,
        {
          id: uid(),
          company: '',
          title: '',
          start: '',
          end: '',
          current: false,
          responsibilities: '',
        },
      ],
    })

  const addEdu = () =>
    set({
      education: [
        ...data.education,
        {
          id: uid(),
          institution: '',
          degree: '',
          field: '',
          startYear: '',
          endYear: '',
          gpa: '',
        },
      ],
    })

  const addProject = () =>
    set({
      projects: [
        ...data.projects,
        { id: uid(), name: '', description: '', tech: [], liveUrl: '', githubUrl: '' },
      ],
    })

  const [tagInputs, setTagInputs] = useState({ tech: '', soft: '', tools: '' })
  const addTag = (field: 'technicalSkills' | 'softSkills' | 'tools', val: string) => {
    if (!val.trim()) return
    set({ [field]: [...data[field], val.trim()] } as Partial<ResumeData>)
    const key = field === 'technicalSkills' ? 'tech' : field === 'softSkills' ? 'soft' : 'tools'
    setTagInputs((s) => ({ ...s, [key]: '' }))
  }

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onStepChange(n)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
              step === n ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 bg-[#16161f]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {(['fullName', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'] as const).map((f) => (
            <div key={f}>
              <label className="mb-1 block text-sm text-zinc-400 capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
              <input
                className={inputClass}
                value={String((data as unknown as Record<string, string>)[f] || '')}
                onChange={(e) => set({ [f]: e.target.value } as Partial<ResumeData>)}
              />
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <textarea
            className={`min-h-[160px] ${inputClass}`}
            placeholder="Professional summary"
            value={data.summary}
            onChange={(e) => set({ summary: e.target.value })}
          />
          <button
            type="button"
            className="mt-3 rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] px-4 py-2 font-semibold"
            onClick={() => enhance('summary', data.summary, '', (t) => set({ summary: t }))}
          >
            ✨ AI Enhance (2 credits) (2 credits)
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <button type="button" onClick={addExp} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
            Add Experience
          </button>
          {data.experience.map((e: ExperienceEntry) => (
            <div key={e.id} className="space-y-2 rounded-xl border border-white/10 bg-[#16161f] p-4">
              <input className={inputClass} placeholder="Company" value={e.company} onChange={(ev) => {
                const experience = data.experience.map((x) => (x.id === e.id ? { ...x, company: ev.target.value } : x))
                set({ experience })
              }} />
              <input className={inputClass} placeholder="Job title" value={e.title} onChange={(ev) => {
                const experience = data.experience.map((x) => (x.id === e.id ? { ...x, title: ev.target.value } : x))
                set({ experience })
              }} />
              <div className="flex gap-2">
                <input className={inputClass} placeholder="Start" value={e.start} onChange={(ev) => {
                  const experience = data.experience.map((x) => (x.id === e.id ? { ...x, start: ev.target.value } : x))
                  set({ experience })
                }} />
                <input className={inputClass} placeholder="End" value={e.end} onChange={(ev) => {
                  const experience = data.experience.map((x) => (x.id === e.id ? { ...x, end: ev.target.value } : x))
                  set({ experience })
                }} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={e.current}
                    onChange={(ev) => {
                      const experience = data.experience.map((x) =>
                        x.id === e.id ? { ...x, current: ev.target.checked } : x
                      )
                      set({ experience })
                    }}
                  />
                  Current
                </label>
              </div>
              <textarea
                className={inputClass}
                placeholder="Responsibilities"
                value={e.responsibilities}
                onChange={(ev) => {
                  const experience = data.experience.map((x) =>
                    x.id === e.id ? { ...x, responsibilities: ev.target.value } : x
                  )
                  set({ experience })
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-sm text-violet-400"
                  onClick={() =>
                    enhance('experience', e.responsibilities, e.title, (t) => {
                      const experience = data.experience.map((x) =>
                        x.id === e.id ? { ...x, responsibilities: t } : x
                      )
                      set({ experience })
                    })
                  }
                >
                  ✨ AI Enhance (2 credits)
                </button>
                <button
                  type="button"
                  className="text-sm text-red-400"
                  onClick={() => set({ experience: data.experience.filter((x) => x.id !== e.id) })}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <button type="button" onClick={addEdu} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
            Add Education
          </button>
          {data.education.map((ed: EducationEntry) => (
            <div key={ed.id} className="space-y-2 rounded-xl border border-white/10 bg-[#16161f] p-4">
              {(['institution', 'degree', 'field', 'startYear', 'endYear', 'gpa'] as const).map((f) => (
                <input
                  key={f}
                  className={inputClass}
                  placeholder={f}
                  value={String((ed as unknown as Record<string, string>)[f] || '')}
                  onChange={(ev) => {
                    const education = data.education.map((x) =>
                      x.id === ed.id ? { ...x, [f]: ev.target.value } : x
                    )
                    set({ education })
                  }}
                />
              ))}
              <button
                type="button"
                className="text-sm text-red-400"
                onClick={() => set({ education: data.education.filter((x) => x.id !== ed.id) })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <SkillTags
            label="Technical Skills"
            tags={data.technicalSkills}
            input={tagInputs.tech}
            onInput={(v) => setTagInputs((s) => ({ ...s, tech: v }))}
            onAdd={() => addTag('technicalSkills', tagInputs.tech)}
            onRemove={(t) =>
              set({ technicalSkills: data.technicalSkills.filter((x) => x !== t) })
            }
          />
          <SkillTags
            label="Soft Skills"
            tags={data.softSkills}
            input={tagInputs.soft}
            onInput={(v) => setTagInputs((s) => ({ ...s, soft: v }))}
            onAdd={() => addTag('softSkills', tagInputs.soft)}
            onRemove={(t) => set({ softSkills: data.softSkills.filter((x) => x !== t) })}
          />
          <SkillTags
            label="Tools & Technologies"
            tags={data.tools}
            input={tagInputs.tools}
            onInput={(v) => setTagInputs((s) => ({ ...s, tools: v }))}
            onAdd={() => addTag('tools', tagInputs.tools)}
            onRemove={(t) => set({ tools: data.tools.filter((x) => x !== t) })}
          />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-6">
          <button type="button" onClick={addProject} className="rounded-lg border border-white/20 px-4 py-2 text-sm">
            Add Project
          </button>
          {data.projects.map((p: ProjectEntry) => (
            <div key={p.id} className="space-y-2 rounded-xl border border-white/10 bg-[#16161f] p-4">
              <input
                className={inputClass}
                placeholder="Project name"
                value={p.name}
                onChange={(ev) => {
                  const projects = data.projects.map((x) => (x.id === p.id ? { ...x, name: ev.target.value } : x))
                  set({ projects })
                }}
              />
              <textarea
                className={inputClass}
                placeholder="Description"
                value={p.description}
                onChange={(ev) => {
                  const projects = data.projects.map((x) =>
                    x.id === p.id ? { ...x, description: ev.target.value } : x
                  )
                  set({ projects })
                }}
              />
              <button
                type="button"
                className="text-sm text-violet-400"
                onClick={() =>
                  enhance('project', p.description, '', (t) => {
                    const projects = data.projects.map((x) => (x.id === p.id ? { ...x, description: t } : x))
                    set({ projects })
                  })
                }
              >
                ✨ AI Enhance (2 credits)
              </button>
              <button
                type="button"
                className="text-sm text-red-400"
                onClick={() => set({ projects: data.projects.filter((x) => x.id !== p.id) })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
        <button
          type="button"
          disabled={step <= 1}
          onClick={() => onStepChange(step - 1)}
          className="rounded-xl border border-white/20 px-6 py-3 text-white disabled:opacity-40"
        >
          Previous
        </button>
        {step < 6 ? (
          <button
            type="button"
            onClick={() => onStepChange(step + 1)}
            className="rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] px-6 py-3 font-semibold text-white"
          >
            Next
          </button>
        ) : (
          <span className="rounded-xl border border-emerald-500/40 px-6 py-3 text-emerald-300">
            Use Preview → Export PDF
          </span>
        )}
      </div>
    </div>
  )
}
