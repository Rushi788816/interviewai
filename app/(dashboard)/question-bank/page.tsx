'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Sparkles, Upload } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'

const CATEGORIES = [
  { id: 'behavioral',  label: 'Behavioral',   emoji: '🤝', desc: 'Situation/Action/Result questions' },
  { id: 'technical',   label: 'Technical',    emoji: '⚡', desc: 'Based on your resume skills' },
  { id: 'hr',          label: 'HR / Culture', emoji: '🏢', desc: 'Strengths, goals, culture fit' },
  { id: 'situational', label: 'Situational',  emoji: '🧩', desc: 'Hypothetical scenarios' },
  { id: 'coding',      label: 'Coding / DSA', emoji: '💻', desc: 'Algorithms & data structures' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

interface QA { question: string; answer: string }

function QACard({ qa, index }: { qa: QA; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 bg-[#0f172a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center text-[11px] font-bold text-[#F7931A]">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-[#E2E8F0] font-medium leading-snug">{qa.question}</span>
        {open
          ? <ChevronUp size={14} className="text-zinc-500 flex-shrink-0 mt-0.5" />
          : <ChevronDown size={14} className="text-zinc-500 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="border-t border-white/6 p-4 pt-3">
          <p className="text-[10px] font-bold text-[#F7931A] uppercase tracking-wider mb-2">Ideal Answer</p>
          <p className="text-sm text-[#CBD5E1] leading-relaxed">{qa.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function QuestionBankPage() {
  const { balance, refetch: refresh } = useCredits()
  const addToast = useToast(s => s.addToast)

  const [category, setCategory] = useState<CategoryId>('behavioral')
  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QA[]>([])
  const [generatedFor, setGeneratedFor] = useState<CategoryId | null>(null)

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
    if (balance < 2) {
      addToast('Need at least 2 credits to generate questions', 'error')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/ai/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, resumeText, jobRole, jobDescription }),
      })
      const d = await r.json() as { questions?: QA[]; error?: string }
      if (!r.ok) { addToast(d.error || 'Failed', 'error'); return }
      setQuestions(d.questions || [])
      setGeneratedFor(category)
      refresh()
    } catch {
      addToast('Generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedCat = CATEGORIES.find(c => c.id === category)!

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={22} className="text-[#F7931A]" />
            Question Bank
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Generate interview questions tailored to your resume — with ideal answers.
          </p>
        </div>

        {/* Setup card */}
        <div className="rounded-2xl border border-white/8 bg-[#111827] p-5 space-y-5">

          {/* Categories */}
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Category</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                    category === cat.id
                      ? 'border-[#F7931A]/50 bg-[#F7931A]/8 text-[#F7931A]'
                      : 'border-white/8 bg-white/3 text-[#64748B] hover:border-white/15 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#64748B]">{selectedCat.desc}</p>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">
              Job Role <span className="text-[#475569] normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* JD */}
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">
              Job Description <span className="text-[#475569] normal-case font-normal">(optional — for more targeted questions)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value.slice(0, 1500))}
              placeholder="Paste the job description here..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Resume */}
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Resume <span className="text-[#475569] normal-case font-normal">(for personalized answers)</span>
            </p>
            {resumeFileName ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/6 px-4 py-3">
                <span className="text-sm text-emerald-400 font-medium">{resumeFileName}</span>
                <button type="button" onClick={() => { setResumeText(''); setResumeFileName('') }} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-3 cursor-pointer hover:border-white/25 transition-colors">
                <Upload size={14} className="text-[#64748B]" />
                <span className="text-sm text-[#64748B]">{extracting ? 'Extracting...' : 'Upload resume (PDF / DOCX)'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  disabled={extracting}
                  onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f) }}
                />
              </label>
            )}
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={loading || balance < 2}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            <Sparkles size={15} />
            {loading ? 'Generating...' : `Generate Questions (2 credits)`}
          </button>
          <p className="text-center text-xs text-[#475569]">You have {balance} credit{balance !== 1 ? 's' : ''}</p>
        </div>

        {/* Results */}
        {questions.length > 0 && generatedFor && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORIES.find(c => c.id === generatedFor)?.emoji}</span>
              <p className="text-sm font-semibold text-white">
                {CATEGORIES.find(c => c.id === generatedFor)?.label} Questions
              </p>
              <span className="text-xs text-[#64748B]">({questions.length})</span>
            </div>
            {questions.map((qa, i) => <QACard key={i} qa={qa} index={i} />)}
          </div>
        )}

      </div>
    </div>
  )
}
