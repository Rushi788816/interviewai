'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Coins, Zap, Star, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    credits: 50,
    icon: Zap,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.25)',
    glow: 'rgba(6,182,212,0.3)',
    features: ['50 AI answers', 'All interview types', '1–2 interviews'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹1,199',
    credits: 150,
    icon: Star,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.35)',
    glow: 'rgba(99,102,241,0.35)',
    popular: true,
    features: ['150 AI answers', '3 Mock Interview sessions', 'ATS Score checks', '4–5 interviews'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '₹2,499',
    credits: 400,
    icon: Crown,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    glow: 'rgba(139,92,246,0.3)',
    features: ['400 AI answers', '8+ Mock sessions', 'Resume AI enhances', '10+ interviews'],
  },
]

export default function CreditsPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')
  const { balance, refetch: refresh } = useCredits()
  const addToast = useToast(s => s.addToast)
  const [loading, setLoading] = useState<string | null>(null)

  const handleBuy = async (planId: string) => {
    setLoading(planId)
    try {
      const r = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const d = await r.json() as { orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string }
      if (!r.ok || !d.orderId) {
        addToast(d.error || 'Failed to create checkout', 'error')
        return
      }
      // Open Razorpay checkout
      const RazorpayClass = (window as any).Razorpay
      if (!RazorpayClass) {
        addToast('Payment gateway not loaded. Please refresh and try again.', 'error')
        return
      }
      const rzp = new RazorpayClass({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency,
        order_id: d.orderId,
        name: 'InterviewAI',
        description: `${planId} plan`,
        handler: async (response: any) => {
          const vr = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, planId }),
          })
          const vd = await vr.json()
          if (vd.success) {
            addToast('Payment successful! Credits added.', 'success')
            refresh()
          } else {
            addToast(vd.error || 'Payment verification failed', 'error')
          }
        },
        theme: { color: '#6366F1' },
      })
      rzp.open()
    } catch {
      addToast('Something went wrong', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Success / cancel banners */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">Payment successful! Your credits have been added.</p>
          </div>
        )}
        {cancelled && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
            <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">Payment cancelled. No charges were made.</p>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Coins size={22} className="text-[#6366F1]" />
            Buy Credits
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            You currently have <span className="text-amber-400 font-bold">{balance} credit{balance !== 1 ? 's' : ''}</span>. Credits never expire.
          </p>
        </div>

        {/* Credit usage guide */}
        <div className="rounded-2xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Credit Usage</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'AI Answer',       cost: '1 credit' },
              { label: 'Mock Interview',  cost: '5 credits' },
              { label: 'Tailor Resume',   cost: '5 credits' },
              { label: 'Cover Letter',    cost: '3 credits' },
              { label: 'ATS Score Check', cost: '3 credits' },
              { label: 'Question Bank',   cost: '2 credits' },
            ].map(({ label, cost }) => (
              <div key={label} className="text-center rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="text-xs text-[#64748B] mb-1">{label}</p>
                <p className="text-sm font-bold text-white">{cost}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className="relative rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:scale-[1.01]"
                style={{
                  background: plan.bg,
                  borderColor: plan.border,
                  boxShadow: plan.popular ? `0 0 30px ${plan.glow}` : undefined,
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: plan.bg, border: `1px solid ${plan.border}` }}>
                    <Icon size={18} style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{plan.name}</p>
                    <p className="text-2xl font-bold" style={{ color: plan.color }}>{plan.price}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: plan.color }} />
                      <p className="text-xs text-[#94A3B8]">{f}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleBuy(plan.id)}
                  disabled={!!loading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}
                >
                  {loading === plan.id ? 'Redirecting...' : `Buy ${plan.credits} Credits`}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-[#374151]">
          Payments are processed securely by Razorpay. GST applicable for Indian users.
        </p>
      </div>
    </div>
  )
}
