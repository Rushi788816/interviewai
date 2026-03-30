'use client'

import { useState } from 'react'
import { FileText, Sparkles, Copy, Check, Upload } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'

const TONES = [
  { id: 'professional',  label: 'Professional', emoji: '👔' },
  { id: 'enthusiastic',  label: 'Enthusiastic',  emoji: '🔥' },
  { id: 'concise',       label: 'Concise',       emoji: '⚡' },
] as const

type Tone = typeof TONES[number]['id']

export default function CoverLetterPage() {
  const { balance, refetch: refresh } = useCredits()
  const addToast = useToast(s => s.addToast)

  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [copied, setCopied] = useState(false)

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
        addToast(d.error || 'Could not extract text', 'error')
      }
    } catch {
      addToast('Upload failed', 'error')
    } finally {
      setExtracting(false)
    }
  }

  const generate = async () => {
    if (!resumeText.trim()) { addToast('Please upload or paste your resume first', 'error'); return }
    if (balance < 3) { addToast('Need at least 3 credits', 'error'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobRole, company, jobDescription, tone }),
      })
      const d = await r.json() as { letter?: string; error?: string }
      if (!r.ok) { addToast(d.error || 'Failed', 'error'); return }
      setLetter(d.letter || '')
      refresh()
    } catch {
      addToast('Generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    addToast('Copied to clipboard', 'success')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={22} className="text-[#F7931A]" />
            Cover Letter Generator
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            AI-written cover letter tailored to your resume and the job — ready in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — inputs */}
          <div className="space-y-4">

            {/* Resume */}
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Resume <span className="text-red-400">*</span></p>
              {resumeFileName ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/6 px-4 py-3">
                  <span className="text-sm text-emerald-400 font-medium truncate">{resumeFileName}</span>
                  <button type="button" onClick={() => { setResumeText(''); setResumeFileName('') }} className="text-xs text-red-400 hover:text-red-300 ml-2 flex-shrink-0">Remove</button>
                </div>
              ) : (
                <>
                  <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-3 cursor-pointer hover:border-white/25 transition-colors mb-2">
                    <Upload size={14} className="text-[#64748B]" />
                    <span className="text-sm text-[#64748B]">{extracting ? 'Extracting...' : 'Upload resume (PDF / DOCX)'}</span>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" disabled={extracting}
                      onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f) }} />
                  </label>
                  <p className="text-xs text-[#475569] text-center mb-2">or paste below</p>
                  <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none resize-none transition-colors"
                  />
                </>
              )}
            </div>

            {/* Job Role & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">Job Role</label>
                <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)}
                  placeholder="e.g. SDE II"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">Company</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none transition-colors" />
              </div>
            </div>

            {/* JD */}
            <div>
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">
                Job Description <span className="text-[#475569] normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value.slice(0, 1500))}
                placeholder="Paste the job description for a more targeted letter..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Tone */}
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Tone</p>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      tone === t.id
                        ? 'border-[#F7931A]/50 bg-[#F7931A]/8 text-[#F7931A]'
                        : 'border-white/8 bg-white/3 text-[#64748B] hover:border-white/15 hover:text-white'
                    }`}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={loading || !resumeText.trim() || balance < 3}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              <Sparkles size={15} />
              {loading ? 'Writing...' : 'Generate Cover Letter (3 credits)'}
            </button>
            <p className="text-center text-xs text-[#475569]">You have {balance} credit{balance !== 1 ? 's' : ''}</p>
          </div>

          {/* Right — output */}
          <div className="rounded-2xl border border-white/8 bg-[#111827] flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <p className="text-sm font-semibold text-white">Generated Letter</p>
              {letter && (
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-[#94A3B8] hover:text-white hover:border-white/20 transition-all"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : letter ? (
                <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{letter}</p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <FileText size={32} className="text-zinc-700" />
                  <p className="text-[#475569] text-sm">Your cover letter will appear here</p>
                  <p className="text-[#374151] text-xs">Upload your resume and click Generate</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
