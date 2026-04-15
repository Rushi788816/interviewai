'use client'

import { useState } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ATSResult {
  overallScore: number
  sections: {
    formatting: { score: number; feedback: string }
    keywords: { score: number; feedback: string; missing: string[] }
    experience: { score: number; feedback: string }
    education: { score: number; feedback: string }
    skills: { score: number; feedback: string }
  }
  topIssues: string[]
  quickWins: string[]
}

function ScoreColor(score: number) {
  if (score >= 71) return '#22c55e'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}

export default function ATSScorePage() {
  const addToast = useToast((s) => s.addToast)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)

  const handleAnalyze = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 50) {
      addToast('Please paste your resume text (min 50 characters)', 'error')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || 'Analysis failed', 'error')
        return
      }
      setResult(data)
    } catch {
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-white">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">ATS Score Checker</h1>
            <p className="text-[#94A3B8] text-sm">See how your resume performs with automated hiring systems</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#94A3B8] bg-white/5 px-3 py-1.5 rounded-full">
          <Zap size={11} className="text-indigo-400" />
          2 credits per analysis
        </div>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
          <label className="block text-sm font-semibold text-white mb-3">
            Resume Text <span className="text-red-400">*</span>
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            rows={12}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#4B5563] outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all resize-none"
          />
          <p className="text-xs text-[#4B5563] mt-2">{resumeText.length} characters</p>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
          <label className="block text-sm font-semibold text-white mb-3">
            Job Description <span className="text-[#64748B] font-normal">(optional — improves accuracy)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here for a more targeted analysis..."
            rows={12}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-[#4B5563] outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all resize-none"
          />
          <p className="text-xs text-[#4B5563] mt-2">{jobDescription.length} characters</p>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <ShieldCheck size={16} />
            Analyze Resume — 2 Credits
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Overall score */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              <div
                className="text-6xl font-bold"
                style={{ color: ScoreColor(result.overallScore) }}
              >
                {result.overallScore}
              </div>
              <div className="text-[#94A3B8] text-sm mt-1">Overall ATS Score</div>
              <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full" style={{
                background: `${ScoreColor(result.overallScore)}20`,
                color: ScoreColor(result.overallScore),
                border: `1px solid ${ScoreColor(result.overallScore)}40`,
              }}>
                {result.overallScore >= 71 ? 'Strong' : result.overallScore >= 41 ? 'Needs Work' : 'Weak'}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {Object.entries(result.sections).map(([key, sec]) => (
                <div key={key} className="bg-white/3 rounded-xl p-3 border border-white/5">
                  <div className="text-xs text-[#64748B] capitalize mb-1">{key}</div>
                  <div className="text-xl font-bold" style={{ color: ScoreColor(sec.score) }}>{sec.score}</div>
                  <div className="text-xs text-[#94A3B8] mt-1 line-clamp-2">{sec.feedback}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing keywords */}
          {result.sections.keywords.missing?.length > 0 && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-amber-400">🔍</span> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.sections.keywords.missing.map((kw, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Issues & Quick Wins */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#111827] border border-red-500/15 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" /> Top Issues
              </h3>
              <ul className="space-y-2">
                {result.topIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                    <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#111827] border border-green-500/15 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle size={15} className="text-green-400" /> Quick Wins
              </h3>
              <ul className="space-y-2">
                {result.quickWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {win}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
