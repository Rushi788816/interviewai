'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Mic, Target, FileText, ArrowRight, CheckCircle } from 'lucide-react'

const ROLES = [
  'SDE I', 'SDE II', 'Senior SDE', 'Frontend Dev', 'Backend Dev',
  'Fullstack Dev', 'DevOps', 'Data Analyst', 'ML Engineer', 'Product Manager',
]

const GOALS = [
  { id: 'first-job',    label: 'Land my first tech job',     emoji: '🎯' },
  { id: 'switch',       label: 'Switch to a better company', emoji: '🚀' },
  { id: 'promotion',    label: 'Prepare for promotion',      emoji: '📈' },
  { id: 'practice',     label: 'Regular interview practice',  emoji: '🔄' },
]

const STEPS = ['Welcome', 'Your Goal', 'Your Role', 'All Set']

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [loading, setLoading] = useState(false)

  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const finalRole = jobRole === 'custom' ? customRole : jobRole

  const finish = async () => {
    setLoading(true)
    try {
      await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole: finalRole, goal }),
      })
    } finally {
      router.replace('/dashboard')
    }
  }

  const canNext = step === 1 ? !!goal : step === 2 ? !!(jobRole && (jobRole !== 'custom' || customRole.trim())) : true

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-6 h-px ${i <= step ? 'bg-[#F7931A]' : 'bg-white/10'}`} />}
              <div className={`w-2 h-2 rounded-full transition-all ${i < step ? 'bg-[#F7931A]' : i === step ? 'bg-white w-3 h-3' : 'bg-white/15'}`} />
            </div>
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)', boxShadow: '0 12px 40px rgba(247,147,26,0.3)' }}>
              🎤
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome, {firstName}!
              </h1>
              <p className="text-[#94A3B8] leading-relaxed">
                InterviewAI listens to interview questions in real-time and gives you perfect answers — completely invisible to screen share.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Mic,      label: 'AI Listens',   sub: 'Hears the question' },
                { icon: Target,   label: 'AI Answers',   sub: 'In seconds' },
                { icon: FileText, label: 'You Speak',    sub: 'Sound natural' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                  <Icon size={18} className="text-[#F7931A] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[10px] text-[#64748B]">{sub}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1 — Goal */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">What&apos;s your goal?</h2>
              <p className="text-[#64748B] text-sm">This helps us tailor your experience</p>
            </div>
            <div className="space-y-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    goal === g.id
                      ? 'border-[#F7931A]/50 bg-[#F7931A]/8'
                      : 'border-white/8 bg-white/3 hover:border-white/15'
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className={`text-sm font-medium ${goal === g.id ? 'text-[#F7931A]' : 'text-white'}`}>{g.label}</span>
                  {goal === g.id && <CheckCircle size={16} className="text-[#F7931A] ml-auto" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canNext}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 — Role */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">What role are you targeting?</h2>
              <p className="text-[#64748B] text-sm">AI answers will be tailored to your role</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setJobRole(r)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    jobRole === r
                      ? 'border-[#F7931A]/50 bg-[#F7931A]/8 text-[#F7931A]'
                      : 'border-white/8 bg-white/3 text-[#94A3B8] hover:border-white/15 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setJobRole('custom')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all col-span-2 ${
                  jobRole === 'custom'
                    ? 'border-[#F7931A]/50 bg-[#F7931A]/8 text-[#F7931A]'
                    : 'border-white/8 bg-white/3 text-[#94A3B8] hover:border-white/15 hover:text-white'
                }`}
              >
                Other (type below)
              </button>
            </div>
            {jobRole === 'custom' && (
              <input
                type="text"
                autoFocus
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="e.g. iOS Developer"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:border-[#F7931A]/50 focus:outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canNext}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 3 — All Set */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl bg-emerald-500/10 border-2 border-emerald-500/30">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
              <p className="text-[#94A3B8]">
                You start with <span className="text-white font-bold">30 free credits</span>. Each AI answer uses 1 credit.
              </p>
            </div>
            <div className="rounded-2xl border border-[#F7931A]/20 bg-[#F7931A]/5 p-4 text-left space-y-2">
              <p className="text-xs font-bold text-[#F7931A] uppercase tracking-wider">Quick Start</p>
              {[
                '1. Click "Interview Assistant" from your dashboard',
                '2. Upload your resume + paste the job description',
                '3. Start your interview — AI will answer in real-time',
              ].map(tip => (
                <p key={tip} className="text-sm text-[#CBD5E1]">{tip}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              {loading ? 'Setting up...' : 'Go to Dashboard →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
