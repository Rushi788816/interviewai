'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import QuestionCard from '@/components/mock-interview/QuestionCard'
import VoiceRecorder from '@/components/mock-interview/VoiceRecorder'
import FeedbackReport, { type EvalItem } from '@/components/mock-interview/FeedbackReport'

const ROLES = ['SDE I', 'SDE II', 'Senior SDE', 'PM', 'Data Analyst', 'QA', 'DevOps', 'Frontend', 'Backend', 'Fullstack']
const COMPANIES = ['FAANG', 'Startup', 'Service Company', 'Product Company']
const DIFFS = [
  { label: 'Easy', color: 'border-emerald-500/50 bg-emerald-500/10' },
  { label: 'Medium', color: 'border-amber-500/50 bg-amber-500/10' },
  { label: 'Hard', color: 'border-red-500/50 bg-red-500/10' },
]

export default function MockInterviewSession({
  userId: _userId,
  credits,
}: {
  userId: string
  credits: number
}) {
  const addToast = useToast((s) => s.addToast)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [role, setRole] = useState(ROLES[0])
  const [companyType, setCompanyType] = useState(COMPANIES[0])
  const [difficulty, setDifficulty] = useState(DIFFS[1].label)
  const [questions, setQuestions] = useState<string[]>([])
  const [qi, setQi] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evals, setEvals] = useState<EvalItem[]>([])
  const [scorePreview, setScorePreview] = useState<{ c: number; r: number; s: number } | null>(null)
  const [recording, setRecording] = useState(false)

  const generate = async () => {
    setStep(2)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          role,
          companyType,
          difficulty,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || 'Failed', 'error')
        setStep(1)
        return
      }
      setQuestions(data.questions || [])
      setQi(0)
      setAnswer('')
      setEvals([])
      setStep(3)
    } catch {
      addToast('Network error', 'error')
      setStep(1)
    }
  }

  const submitAnswer = async () => {
    if (!questions[qi] || !answer.trim()) return
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          question: questions[qi],
          answer: answer.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || 'Evaluate failed', 'error')
        return
      }
      const item: EvalItem = {
        question: questions[qi],
        userAnswer: answer.trim(),
        clarity: Number(data.clarity) || 0,
        relevance: Number(data.relevance) || 0,
        structure: Number(data.structure) || 0,
        feedback: String(data.feedback || ''),
        betterAnswer: String(data.betterAnswer || ''),
      }
      setEvals((prev) => [...prev, item])
      setScorePreview({ c: item.clarity, r: item.relevance, s: item.structure })
      setTimeout(() => {
        setScorePreview(null)
        setAnswer('')
        if (qi < questions.length - 1) setQi((q) => q + 1)
        else setStep(4)
      }, 2000)
    } catch {
      addToast('Evaluate failed', 'error')
    }
  }

  const overallScore = () => {
    if (evals.length === 0) return 0
    const sum = evals.reduce(
      (acc, e) => acc + (e.clarity + e.relevance + e.structure) / 3,
      0
    )
    return Math.round(sum / evals.length)
  }

  const saveResults = async () => {
    try {
      const res = await fetch('/api/sessions/save-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          companyType,
          difficulty,
          questions,
          answers: evals.map((e) => e.userAnswer || ''),
          scores: evals,
          overallScore: overallScore(),
        }),
      })
      if (res.ok) addToast('Results saved!', 'success')
      else addToast('Save failed', 'error')
    } catch {
      addToast('Save failed', 'error')
    }
  }

  if (step === 1) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-white">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🎯 AI Mock Interview</h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            Pick your role, company type, and difficulty. We&apos;ll generate 5 tailored questions (10 credits).
          </p>
        </div>
        {credits < 10 && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            You need at least 10 credits to start.
          </p>
        )}
        <div>
          <p className="mb-3 font-semibold">Role</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  role === r ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-[#16161f] hover:bg-[#1c1c27]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 font-semibold">Company type</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {COMPANIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompanyType(c)}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  companyType === c ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-[#16161f]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 font-semibold">Difficulty</p>
          <div className="flex flex-wrap gap-3">
            {DIFFS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDifficulty(d.label)}
                className={`rounded-xl border px-6 py-3 ${d.color} ${
                  difficulty === d.label ? 'ring-2 ring-violet-500' : ''
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={credits < 10}
          onClick={generate}
          className="w-full rounded-xl bg-gradient-to-r from-[#F7931A] to-[#FF6B2B] py-4 font-semibold text-white disabled:opacity-40"
        >
          Start Mock Interview (10 credits)
        </button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-white">
        <div
          className="h-14 w-14 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"
          aria-hidden
        />
        <p className="text-zinc-400">Generating your personalized questions…</p>
      </div>
    )
  }

  if (step === 3 && questions.length > 0) {
    const q = questions[qi]
    const last = qi === questions.length - 1
    return (
      <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 text-white">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${((qi + 1) / questions.length) * 100}%` }}
          />
        </div>
        <QuestionCard index={qi + 1} total={questions.length} question={q} recording={recording} />
        <VoiceRecorder
          value={answer}
          onChange={setAnswer}
          onRecordingChange={setRecording}
        />
        {scorePreview && (
          <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 text-center">
            <p className="text-sm text-zinc-400">Scores</p>
            <p className="text-lg font-bold">
              Clarity {scorePreview.c} · Relevance {scorePreview.r} · Structure {scorePreview.s}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={submitAnswer}
          disabled={!answer.trim() || !!scorePreview}
          className="w-full rounded-xl bg-gradient-to-r from-[#F7931A] to-[#FF6B2B] py-3 font-semibold disabled:opacity-40"
        >
          {last ? 'View Results' : 'Submit Answer'}
        </button>
      </div>
    )
  }

  if (step === 4) {
    return (
      <FeedbackReport
        overall={overallScore()}
        items={evals}
        onTryAgain={() => {
          setStep(1)
          setQuestions([])
          setEvals([])
          setQi(0)
        }}
        onSave={saveResults}
      />
    )
  }

  return null
}
