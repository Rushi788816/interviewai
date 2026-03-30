'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { emptyResume, type ResumeData, type ResumeTemplateId } from '@/lib/resumeTypes'
import ResumeBuilder from '@/components/resume/ResumeBuilder'
import TemplateSelector from '@/components/resume/TemplateSelector'
import ResumePreview from '@/components/resume/ResumePreview'
import { Save, Eye, EyeOff, Upload } from 'lucide-react'

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
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  // Hydrate: try DB first, fall back to localStorage
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/resume/load')
        const json = await res.json() as { data: { resumeData?: ResumeData; template?: ResumeTemplateId } | null }
        if (json.data?.resumeData) {
          setResumeData(json.data.resumeData)
          setTemplate(json.data.template || 'classic')
          setHydrated(true)
          return
        }
      } catch {}
      // Fall back to localStorage
      const saved = loadFromStorage()
      setResumeData(saved.data)
      setTemplate(saved.template)
      setHydrated(true)
    }
    void load()
  }, [])

  // Persist to localStorage + DB whenever resumeData or template changes
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData))
      localStorage.setItem(TEMPLATE_KEY, template)
    } catch {}
    // Debounced DB save (fire and forget)
    const timer = setTimeout(() => {
      fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { resumeData, template } }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [resumeData, template, hydrated])

  const handleDataChange = useCallback((data: ResumeData) => {
    setResumeData(data)
    // Brief save indicator
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1500)
  }, [])

  const handleReset = () => {
    if (confirm('Reset resume to blank? This cannot be undone.')) {
      const empty = emptyResume()
      setResumeData(empty)
      setTemplate('classic')
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TEMPLATE_KEY)
      fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { resumeData: empty, template: 'classic' } }),
      }).catch(() => {})
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImporting(true)
    setImportError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/ai/parse-resume', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) { setImportError(json.error || 'Import failed'); return }
      setResumeData(json.data)
      setStep(1)
    } catch {
      setImportError('Upload failed. Please try again.')
    } finally {
      setImporting(false)
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
          <p className="text-[#94A3B8] text-sm mt-1">Build an ATS-optimized resume — auto-saved to your account</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Save indicator */}
          {saveIndicator && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
              <Save size={12} /> Saved
            </span>
          )}
          {/* Upload existing resume */}
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${importing ? 'opacity-60 cursor-not-allowed border-[#F7931A]/30 text-[#F7931A]' : 'border-[#F7931A]/40 text-[#F7931A] hover:bg-[#F7931A]/10'}`}>
            {importing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Upload size={14} />
                Import Resume
              </>
            )}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              disabled={importing}
              onChange={handleImport}
            />
          </label>
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

      {/* Import error */}
      {importError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{importError}</span>
          <button onClick={() => setImportError('')} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

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
