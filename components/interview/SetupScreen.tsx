'use client'

import { useCallback, useRef, useState } from 'react'
import type { SessionContext } from '@/types'
import { sanitizeReadableText } from '@/lib/sanitizeText'

const JD_MAX = 3000

const ROLE_CHIPS = [
  'SDE I',
  'SDE II',
  'Senior SDE',
  'Frontend Dev',
  'Backend Dev',
  'Fullstack Dev',
  'DevOps',
  'Data Analyst',
  'ML Engineer',
  'PM',
  'QA Engineer',
] as const

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionSuccess, setExtractionSuccess] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const jdLen = jobDescription.length
  const progressPct = Math.round((step / 3) * 100)

  const handleFileUpload = useCallback(async (file: File) => {
    setResumeFile(file)
    setResumeFileName(file.name)
    setIsExtracting(true)
    setResumeText('')
    setExtractionSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/extract-text', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as {
        text?: string
        pages?: number
        error?: string
        note?: string
        warning?: string
      }

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed')
      }

      if (data.text) {
        setResumeText(sanitizeReadableText(data.text, 8000))
        setExtractionSuccess(
          data.pages != null
            ? `✅ Extracted text from ${data.pages} page${data.pages === 1 ? '' : 's'}`
            : '✅ Resume text extracted successfully'
        )
      } else {
        setResumeText('')
        setExtractionSuccess(
          data.warning
            ? `⚠️ ${data.warning}`
            : '⚠️ Could not extract text — paste your resume below or continue with role + JD only'
        )
      }
    } catch (error) {
      console.error('File extraction error:', error)
      setResumeText('')
      setExtractionSuccess('⚠️ Extraction failed — you can paste resume text manually below')
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const goNext = () => {
    if (step === 1) {
      if (!jobRole.trim()) return
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    if (step === 3) {
      onComplete({
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.slice(0, JD_MAX),
        resumeText: sanitizeReadableText(resumeText, 8000),
        resumeFileName,
      })
    }
  }

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const skipStep = () => {
    if (step === 2) setStep(3)
    else if (step === 3) {
      onComplete({
        jobRole: jobRole.trim() || 'General',
        jobDescription: jobDescription.slice(0, JD_MAX),
        resumeText: sanitizeReadableText(resumeText, 8000),
        resumeFileName,
      })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#0A0F1E] p-4 sm:p-6">
      {/* Removed absolute close button for inline integration */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">🎯 Setup Your Interview Session</h1>
            <p className="mt-1 text-sm text-zinc-400">Help AI give you personalized answers</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          {(['Role', 'Job Description', 'Resume'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <span className="text-zinc-600">→</span>}
              <span
                className={
                  step === i + 1
                    ? 'font-semibold text-[#2563EB]'
                    : step > i + 1
                      ? 'text-emerald-500/90'
                      : ''
                }
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4 sm:p-6">
          {/* Step content unchanged */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-300">
                What role are you interviewing for? <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer, Product Manager, Data Analyst"
                className="w-full rounded-lg border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#2563EB] focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {ROLE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setJobRole(chip)}
                    className="rounded-full border border-white/10 bg-[#0A0F1E] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-[#2563EB]/50 hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-300">
                Paste the Job Description (optional but recommended)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value.slice(0, JD_MAX))}
                rows={8}
                placeholder="Paste the full job description here. AI will tailor answers to match exactly what the company is looking for..."
                className="w-full resize-y rounded-lg border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#2563EB] focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {jdLen} / {JD_MAX} characters
                </span>
                <button
                  type="button"
                  onClick={skipStep}
                  className="text-zinc-400 underline hover:text-white"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-300">Upload Your Resume (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFileUpload(f)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center text-sm transition-all ${
                  isDragging
                    ? 'border-[#2563EB] bg-[#2563EB]/10'
                    : 'border-white/20 hover:border-[#2563EB]/50 hover:bg-white/5'
                }`}
              >
                📄 Drop your resume here or click to browse
                <span className="mt-2 block text-xs text-zinc-500">.pdf, .txt, .doc, .docx</span>
              </button>

              {isExtracting && (
                <div className="flex items-center gap-2 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-2 text-sm text-zinc-200">
                  <span
                    className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent"
                    aria-hidden
                  />
                  <span>📄 Extracting text from resume...</span>
                </div>
              )}

              {resumeFileName && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  <span className="shrink-0">✅</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{resumeFileName}</span>
                  {resumeFile ? (
                    <span className="shrink-0 text-xs text-emerald-400/90">{formatFileSize(resumeFile.size)}</span>
                  ) : null}
                </div>
              )}

              {extractionSuccess ? (
                <p className="text-sm text-zinc-300" role="status">
                  {extractionSuccess}
                </p>
              ) : null}

              <div>
                <label className="mb-2 block text-xs text-zinc-500">Or paste your resume text here</label>
                <div className="relative">
                  {isExtracting ? (
                    <div
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-[#0A0F1E]/85 px-4 text-center text-sm text-zinc-300"
                      aria-live="polite"
                    >
                      <span
                        className="size-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent"
                        aria-hidden
                      />
                      <span>📄 Extracting text from resume...</span>
                    </div>
                  ) : null}
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    disabled={isExtracting}
                    rows={6}
                    placeholder="Paste resume content..."
                    className="w-full resize-y rounded-lg border border-white/10 bg-[#0A0F1E] px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#2563EB] focus:outline-none disabled:cursor-wait disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={skipStep}
                  className="text-sm text-zinc-400 underline hover:text-white"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={step === 1 ? onSkip : goBack}
            className="rounded-xl border border-white/10 bg-[#1E2A3A] px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-[#1E3A5F]"
          >
            {step === 1 ? 'Skip Setup' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 1 && !jobRole.trim()}
              className="cursor-pointer rounded-xl border-none bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={isExtracting}
              className="cursor-pointer rounded-xl border-none bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-8 py-3 text-base font-semibold text-white shadow-[0_0_24px_rgba(37,99,235,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Interview →
            </button>
          )}
        </div>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[#1E2A3A]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-zinc-600">{progressPct}% complete</p>
      </div>
    </div>
  )
}

