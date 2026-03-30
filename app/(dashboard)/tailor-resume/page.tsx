'use client'

import { useState } from 'react'
import { Wand2, Upload, Copy, Check, ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertCircle, Download, FileText } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'
import type { ResumeData, ResumeTemplateId } from '@/lib/resumeTypes'
import dynamic from 'next/dynamic'
import { exportResumeAsDoc } from '@/lib/resumeDocExport'

// Lazy-load the heavy template components
const ClassicTemplate    = dynamic(() => import('@/components/resume/templates/ClassicTemplate'))
const ModernTemplate     = dynamic(() => import('@/components/resume/templates/ModernTemplate'))
const MinimalTemplate    = dynamic(() => import('@/components/resume/templates/MinimalTemplate'))
const ProfessionalTemplate = dynamic(() => import('@/components/resume/templates/ProfessionalTemplate'))
const ExecutiveTemplate  = dynamic(() => import('@/components/resume/templates/ExecutiveTemplate'))
const CreativeTemplate   = dynamic(() => import('@/components/resume/templates/CreativeTemplate'))
const CompactTemplate    = dynamic(() => import('@/components/resume/templates/CompactTemplate'))
const BoldTemplate       = dynamic(() => import('@/components/resume/templates/BoldTemplate'))

const TEMPLATES: { id: ResumeTemplateId; label: string }[] = [
  { id: 'classic',      label: 'Classic' },
  { id: 'modern',       label: 'Modern' },
  { id: 'minimal',      label: 'Minimal' },
  { id: 'professional', label: 'Professional' },
  { id: 'executive',    label: 'Executive' },
  { id: 'creative',     label: 'Creative' },
  { id: 'compact',      label: 'Compact' },
  { id: 'bold',         label: 'Bold' },
]

function TemplatePreview({ data, template }: { data: ResumeData; template: ResumeTemplateId }) {
  const body =
    template === 'modern'       ? <ModernTemplate data={data} />       :
    template === 'minimal'      ? <MinimalTemplate data={data} />      :
    template === 'professional' ? <ProfessionalTemplate data={data} /> :
    template === 'executive'    ? <ExecutiveTemplate data={data} />    :
    template === 'creative'     ? <CreativeTemplate data={data} />     :
    template === 'compact'      ? <CompactTemplate data={data} />      :
    template === 'bold'         ? <BoldTemplate data={data} />         :
    <ClassicTemplate data={data} />
  return <>{body}</>
}

interface ExperienceSection {
  title: string
  original: string
  tailored: string
}

interface TailoredResult {
  summary: { original: string; tailored: string }
  skills: { original: string; tailored: string; added: string[] }
  experience: ExperienceSection[]
  keywords_matched: string[]
  keywords_missing: string[]
  ats_score_before: number
  ats_score_after: number
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] text-[#94A3B8] hover:text-white hover:border-white/20 transition-all flex-shrink-0"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function SectionCard({ title, original, tailored }: { title: string; original: string; tailored: string }) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className="rounded-xl border border-white/8 bg-[#111827] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <CopyButton text={tailored} />
      </div>
      <div className="p-4 space-y-3">
        {/* Tailored */}
        <div className="rounded-lg bg-emerald-500/6 border border-emerald-500/20 p-3">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Tailored</p>
          <p className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">{tailored}</p>
        </div>
        {/* Original toggle */}
        {original && (
          <button
            type="button"
            onClick={() => setShowOriginal(o => !o)}
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors"
          >
            {showOriginal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showOriginal ? 'Hide original' : 'Show original'}
          </button>
        )}
        {showOriginal && original && (
          <div className="rounded-lg bg-white/3 border border-white/8 p-3">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Original</p>
            <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">{original}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TailorResumePage() {
  const { balance, refetch: refresh } = useCredits()
  const addToast = useToast(s => s.addToast)

  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailoredResult | null>(null)
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('classic')
  const [parsing, setParsing] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const handleFileUpload = async (file: File) => {
    setExtracting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/resume/extract-text', { method: 'POST', body: fd })
      const d = await r.json() as { text?: string; error?: string }
      if (d.text && d.text.trim().length > 30) {
        setResumeText(d.text)
        setResumeFileName(file.name)
      } else {
        addToast(d.error || 'Could not extract text — try pasting manually', 'error')
      }
    } catch {
      addToast('Upload failed', 'error')
    } finally {
      setExtracting(false)
    }
  }

  const handleTailor = async () => {
    if (!resumeText.trim()) { addToast('Please upload or paste your resume first', 'error'); return }
    if (!jobDescription.trim()) { addToast('Please paste the job description', 'error'); return }
    if (balance < 5) { addToast('Need at least 5 credits', 'error'); return }
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      const d = await r.json() as { tailored?: TailoredResult; error?: string }
      if (!r.ok) { addToast(d.error || 'Failed to tailor resume', 'error'); return }
      setResult(d.tailored || null)
      refresh()
    } catch {
      addToast('Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const parseForDownload = async () => {
    if (!result) return
    setParsing(true)
    try {
      const r = await fetch('/api/ai/tailor-resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, tailored: result }),
      })
      const d = await r.json() as { resumeData?: ResumeData; error?: string }
      if (!r.ok || !d.resumeData) { addToast(d.error || 'Failed to prepare resume', 'error'); return }
      setParsedResume(d.resumeData)
    } catch {
      addToast('Something went wrong', 'error')
    } finally {
      setParsing(false)
    }
  }

  const downloadPdf = async () => {
    const el = document.getElementById('tailor-resume-preview')
    if (!el) return
    setExportingPdf(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const img = canvas.toDataURL('image/png')
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      pdf.addImage(img, 'PNG', 0, 0, w, h)
      pdf.save(`${(parsedResume?.fullName || 'resume').replace(/\s+/g, '-')}-tailored.pdf`)
      addToast('PDF downloaded', 'success')
    } catch {
      addToast('PDF export failed', 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  const downloadDoc = () => {
    if (!parsedResume) return
    exportResumeAsDoc(parsedResume)
    addToast('Word document downloaded', 'success')
  }

  const scoreDiff = result ? result.ats_score_after - result.ats_score_before : 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 size={22} className="text-[#F7931A]" />
            Tailor Resume to Job
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            AI rewrites your Summary, Skills, and Experience bullets to match the job — without changing your format.
          </p>
        </div>

        {/* Inputs */}
        <div className="rounded-2xl border border-white/8 bg-[#111827] p-5 space-y-5">

          {/* Resume */}
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Your Resume <span className="text-red-400">*</span>
            </p>
            {resumeFileName ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/6 px-4 py-3">
                <span className="text-sm text-emerald-400 font-medium truncate">{resumeFileName}</span>
                <button
                  type="button"
                  onClick={() => { setResumeText(''); setResumeFileName('') }}
                  className="text-xs text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-3 cursor-pointer hover:border-white/25 transition-colors mb-2">
                  <Upload size={14} className="text-[#64748B]" />
                  <span className="text-sm text-[#64748B]">
                    {extracting ? 'Extracting...' : 'Upload resume (PDF / DOCX / TXT)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    disabled={extracting}
                    onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f) }}
                  />
                </label>
                <p className="text-xs text-[#475569] text-center mb-2">or paste below</p>
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none resize-none transition-colors"
                />
              </>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">
              Job Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value.slice(0, 2000))}
              placeholder="Paste the full job description here..."
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none resize-none transition-colors"
            />
            <p className="text-right text-[10px] text-[#374151] mt-1">{jobDescription.length}/2000</p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleTailor}
            disabled={loading || !resumeText.trim() || !jobDescription.trim() || balance < 5}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            <Sparkles size={15} />
            {loading ? 'Tailoring...' : 'Tailor My Resume (5 credits)'}
          </button>
          <p className="text-center text-xs text-[#475569]">You have {balance} credit{balance !== 1 ? 's' : ''}</p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-2xl border border-white/8 bg-[#111827] p-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#64748B]">Analyzing JD and tailoring your resume...</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* ATS Score banner */}
            <div className="rounded-2xl border border-[#F7931A]/20 bg-[#F7931A]/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={18} className="text-[#F7931A]" />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8] mb-0.5">Estimated ATS Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#64748B] line-through">{result.ats_score_before}</span>
                    <span className="text-[#F7931A]">→</span>
                    <span className="text-2xl font-bold text-white">{result.ats_score_after}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      +{scoreDiff} pts
                    </span>
                  </div>
                </div>
              </div>
              {/* Keywords matched */}
              {result.keywords_matched?.length > 0 && (
                <div className="flex-1">
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5">Keywords Matched</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords_matched.slice(0, 6).map(k => (
                      <span key={k} className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skills added chips */}
            {result.skills?.added?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#64748B]">Keywords added:</span>
                {result.skills.added.map(k => (
                  <span key={k} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7931A]/10 border border-[#F7931A]/25 text-[#F7931A]">{k}</span>
                ))}
              </div>
            )}

            {/* Missing keywords warning */}
            {result.keywords_missing?.length > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/6 px-4 py-3">
                <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">Skills gap — consider adding to your resume:</p>
                  <p className="text-xs text-[#94A3B8]">{result.keywords_missing.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Section cards */}
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Tailored Sections — Copy & paste into your resume</p>

            {result.summary?.tailored && (
              <SectionCard
                title="Professional Summary"
                original={result.summary.original}
                tailored={result.summary.tailored}
              />
            )}

            {result.skills?.tailored && (
              <SectionCard
                title="Skills"
                original={result.skills.original}
                tailored={result.skills.tailored}
              />
            )}

            {result.experience?.map((exp, i) => (
              <SectionCard
                key={i}
                title={exp.title || `Experience ${i + 1}`}
                original={exp.original}
                tailored={exp.tailored}
              />
            ))}

            {/* Download section */}
            <div className="rounded-2xl border border-white/8 bg-[#111827] p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-white">Download Full Resume</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  AI will build your complete resume with all tailored content — pick a template and download.
                </p>
              </div>

              {!parsedResume ? (
                <button
                  type="button"
                  onClick={parseForDownload}
                  disabled={parsing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 border border-[#F7931A]/40 bg-[#F7931A]/10 text-[#F7931A]"
                >
                  <FileText size={15} />
                  {parsing ? 'Building resume...' : 'Prepare Full Resume for Download'}
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Template selector */}
                  <div>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Template</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                            selectedTemplate === t.id
                              ? 'border-[#F7931A]/50 bg-[#F7931A]/10 text-[#F7931A]'
                              : 'border-white/8 bg-white/3 text-[#64748B] hover:border-white/15 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={downloadPdf}
                      disabled={exportingPdf}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
                    >
                      <Download size={15} />
                      {exportingPdf ? 'Exporting...' : 'Download PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={downloadDoc}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      <Download size={15} />
                      Download Word (.doc)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden off-screen template render for PDF export */}
            {parsedResume && (
              <div
                id="tailor-resume-preview"
                style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px', zIndex: -1 }}
                aria-hidden="true"
              >
                <TemplatePreview data={parsedResume} template={selectedTemplate} />
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
