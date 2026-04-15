'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'
import {
  User,
  Shield,
  Coins,
  History,
  LogOut,
  Save,
  Check,
  Clock,
  Zap,
  Gift,
  Copy,
} from "lucide-react"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { balance } = useCredits()
  const addToast = useToast((s) => s.addToast)
  const [name, setName] = useState('')
  const [sessions, setSessions] = useState<
    { id: string; createdAt: string; mode: string; duration: number; creditsUsed: number }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [referralApplying, setReferralApplying] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    setName(session?.user?.name || '')
  }, [session?.user?.name])

  useEffect(() => {
    void (async () => {
      setSessionsLoading(true)
      try {
        const res = await fetch('/api/sessions/recent?limit=20')
        if (res.ok) {
          const j = await res.json()
          setSessions(j.sessions || [])
        }
      } finally {
        setSessionsLoading(false)
      }
    })()
  }, [])

  const saveName = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await update({})
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        addToast('Profile updated', 'success')
      } else {
        addToast('Update failed', 'error')
      }
    } catch {
      addToast('Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) return null

  const initial = (session.user.name || session.user.email || '?')[0].toUpperCase()

  const plans = [
    {
      id: 'starter',
      title: 'Starter',
      price: '₹499',
      credits: '50 credits',
      features: ['Real-time AI answers', 'All interview types', '52+ languages', 'Credits never expire'],
    },
    {
      id: 'pro',
      title: 'Pro',
      price: '₹1,199',
      credits: '150 credits',
      mostPopular: true,
      features: ['Everything in Starter', 'Desi Mode 🇮🇳', 'AI Mock Interview', 'Resume AI Enhancement', 'Priority support'],
    },
    {
      id: 'power',
      title: 'Power',
      price: '₹2,499',
      credits: '400 credits',
      features: ['Everything in Pro', 'Unlimited Mock Interviews', 'Advanced analytics', 'Custom answer style', 'Dedicated support'],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-white">

      {/* Page title */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* SECTION 1 — PROFILE */}
      <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Profile Information</h2>
            <p className="text-[#94A3B8] text-xs">Update your personal details</p>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {initial}
          </div>
          <div className="flex-1 text-sm text-[#94A3B8]">
            <p className="text-white font-medium">{session.user.name || 'No name set'}</p>
            <p>{session.user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Full name input */}
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Full Name</label>
            <input
              className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#6366F1]/40 focus:ring-1 focus:ring-[#6366F1]/20 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Email Address</label>
            <div className="relative">
              <input
                className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 pr-12 text-[#64748B] text-sm cursor-not-allowed"
                value={session.user.email || ''}
                disabled
                placeholder="your@email.com"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Shield size={15} className="text-[#4B5563]" />
              </div>
            </div>
            <p className="text-xs text-[#4B5563] mt-1">Email cannot be changed</p>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={saveName}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {success && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                <Check size={15} />
                Saved successfully
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2 — CREDITS */}
      <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            <Coins size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Credits & Plans</h2>
            <p className="text-[#94A3B8] text-xs">Buy credits to unlock AI answers, mock interviews & more</p>
          </div>
        </div>

        {/* Balance banner */}
        <div className="rounded-2xl border border-[#6366F1]/20 p-5 mb-6" style={{ background: 'rgba(99,102,241,0.05)' }}>
          <div className="flex items-center gap-4">
            <Coins size={28} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-3xl font-bold text-white">{balance}</p>
              <p className="text-[#94A3B8] text-sm">Credits Remaining</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] bg-white/5 px-3 py-1.5 rounded-full">
                <Zap size={11} className="text-[#6366F1]" />
                Never expires
              </span>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl border p-5 flex flex-col"
              style={{
                backgroundColor: plan.mostPopular ? 'rgba(99,102,241,0.04)' : 'transparent',
                borderColor: plan.mostPopular ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {plan.mostPopular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  MOST POPULAR
                </div>
              )}
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">{plan.title}</p>
                <div className="text-2xl font-bold text-white">
                  {plan.price}
                  <span className="text-sm font-normal text-[#94A3B8]"> + GST</span>
                </div>
                <p className="text-sm font-semibold mt-1" style={{ color: plan.mostPopular ? '#6366F1' : '#94A3B8' }}>
                  🪙 {plan.credits}
                </p>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#94A3B8]">
                    <Check size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/credits"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-center block transition-all hover:opacity-90 hover:scale-[1.02]"
                style={
                  plan.mostPopular
                    ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white' }
                    : { backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0' }
                }
              >
                Buy {plan.credits}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#4B5563] mt-6">
          🔒 Secure payments • Credits never expire • Instant delivery
        </p>
      </section>

      {/* SECTION 3 — SESSION HISTORY */}
      <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
            <History size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Session History</h2>
            <p className="text-[#94A3B8] text-xs">Your recent interview sessions</p>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full">
            <thead className="bg-white/3 border-b border-white/5">
              <tr>
                {['Date', 'Duration', 'Type', 'Credits'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#4B5563]">
                        <History size={24} />
                      </div>
                      <p className="text-[#64748B] text-sm">No sessions yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => (
                  <tr key={s.id} className={`border-b border-white/4 hover:bg-white/2 transition-colors ${i === sessions.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3 text-white text-sm font-medium">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-sm">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {Math.round(s.duration / 60)} min
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
                        {s.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-sm">
                      <span className="flex items-center gap-1.5">
                        <Coins size={12} className="text-amber-400" />
                        {s.creditsUsed}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* SECTION 3b — REFER & EARN */}
      <section className="bg-[#111827] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
            <Gift size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Refer &amp; Earn</h2>
            <p className="text-[#94A3B8] text-xs">Share your link. When a friend signs up, you both get 20 free credits.</p>
          </div>
        </div>

        {/* User's referral code */}
        {session?.user && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Your Referral Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={`https://interviewai.in/signup?ref=${(session.user as any).id || 'your-code'}`}
                className="flex-1 bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-[#94A3B8] text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const code = (session.user as any).id || 'your-code'
                  navigator.clipboard.writeText(`https://interviewai.in/signup?ref=${code}`)
                  addToast('Referral link copied!', 'success')
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <Copy size={14} />
                Copy Link
              </button>
            </div>
            <p className="text-xs text-[#4B5563] mt-2">You and your friend each receive 20 free credits when they sign up using your link.</p>
          </div>
        )}

        {/* Apply referral code */}
        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-2">Have a referral code? Enter it below</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              placeholder="Enter referral code"
              className="flex-1 bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#6366F1]/40 focus:ring-1 focus:ring-[#6366F1]/20 transition-all"
            />
            <button
              type="button"
              disabled={referralApplying || !referralCodeInput.trim()}
              onClick={async () => {
                setReferralApplying(true)
                try {
                  const res = await fetch('/api/referral/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referralCode: referralCodeInput.trim() }),
                  })
                  const d = await res.json()
                  if (d.success) {
                    addToast('Referral applied! 20 credits added.', 'success')
                    setReferralCodeInput('')
                  } else {
                    addToast(d.error || 'Failed to apply referral', 'error')
                  }
                } catch {
                  addToast('Something went wrong', 'error')
                } finally {
                  setReferralApplying(false)
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366F1' }}
            >
              {referralApplying ? 'Applying…' : 'Apply Code'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4 — ACCOUNT */}
      <section className="bg-red-500/3 border border-red-500/15 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400">
            <LogOut size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Account</h2>
            <p className="text-[#94A3B8] text-xs">Manage your session access</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium transition-all hover:bg-red-500/10 hover:border-red-500/60"
        >
          <LogOut size={16} />
          Sign Out of InterviewAI
        </button>
      </section>
    </div>
  )
}
