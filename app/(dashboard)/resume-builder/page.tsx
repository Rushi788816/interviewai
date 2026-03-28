'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { emptyResume, type ResumeData, type ResumeTemplateId } from '@/lib/resumeTypes'
import ResumeBuilder from '@/components/resume/ResumeBuilder'
import TemplateSelector from '@/components/resume/TemplateSelector'
import ResumePreview from '@/components/resume/ResumePreview'
import { Save, Eye, EyeOff } from 'lucide-react'

const STORAGE_KEY = 'interviewai_resume_data'
const TEMPLATE_KEY = 'interviewai_resume_template'

function loadFromStorage(): { data: ResumeData; template: ResumeTemplateId } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const tmpl = localStorage.getItem(TEMPLATE_KEY) as ResumeTemplateId | null
    return {
      data: raw ? (JSON.parse(raw) as ResumeData) : emptyResume(),
      template: tmpl || 'classic',
    }
  } catch {
    return { data: emptyResume(), template: 'classic' }
  }
}

export default function ResumeBuilderPage() {
  const { status } = useSession()
  const router = useRouter()

  const [resumeData, setResumeData] = useState<ResumeData>(() => emptyResume())
  const [template, setTemplate] = useState<ResumeTemplateId>('classic')
  const [step, setStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const saved = loadFromStorage()
    setResumeData(saved.data)
    setTemplate(saved.template)
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever resumeData or template changes
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData))
      localStorage.setItem(TEMPLATE_KEY, template)
    } catch {}
  }, [resumeData, template, hydrated])

  const handleDataChange = useCallback((data: ResumeData) => {
    setResumeData(data)
    // Brief save indicator
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [])

  const handleReset = () => {
    if (confirm('Reset resume to blank? This cannot be undone.')) {
      setResumeData(emptyResume())
      setTemplate('classic')
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TEMPLATE_KEY)
    }
  }

  if (status !== 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-7 h-7 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Resume Builder</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Build an ATS-optimized resume — auto-saved locally</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save indicator */}
          {saveIndicator && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium animate-fade-in">
              <Save size={12} />
              Saved
            </span>
          )}
          {/* Mobile preview toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#94A3B8] text-sm hover:text-white hover:border-[#F7931A]/30 transition-all"
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-white/10 text-[#94A3B8] text-sm hover:text-red-400 hover:border-red-400/30 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Two-column layout: editor left, preview right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Editor column — hidden on mobile when preview is shown */}
        <div className={`space-y-4 ${showPreview ? 'hidden lg:block' : 'block'}`}>
          <TemplateSelector selected={template} onSelect={setTemplate} />
          <ResumeBuilder
            data={resumeData}
            onChange={handleDataChange}
            step={step}
            onStepChange={setStep}
          />
        </div>

        {/* Preview column — hidden on mobile when editing */}
        <div className={`lg:sticky lg:top-20 ${showPreview ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Preview</p>
              <span className="text-xs text-[#94A3B8]">Template: {template}</span>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-12rem)] rounded-xl">
              <ResumePreview data={resumeData} template={template} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
