"use client"

import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    title: 'Starter',
    price: '₹499',
    gst: '+ GST',
    credits: '50 credits',
    bestFor: 'Best for 1–2 interviews',
    features: [
      'Real-time AI answers',
      'All interview types (Technical, Behavioral, Coding)',
      '52+ languages supported',
      'Invisible Mode (screen-share safe)',
      'Credits never expire',
    ],
  },
  {
    id: 'pro',
    title: 'Pro',
    price: '₹1,199',
    gst: '+ GST',
    credits: '150 credits',
    bestFor: 'Best for 4–5 interviews',
    mostPopular: true,
    features: [
      'Everything in Starter',
      'Desi Mode 🇮🇳',
      'AI Mock Interview (3 sessions)',
      'Resume AI Enhancement',
      'ATS Score Checker',
      'Priority support',
    ],
  },
  {
    id: 'power',
    title: 'Power',
    price: '₹2,499',
    gst: '+ GST',
    credits: '400 credits',
    bestFor: 'Best for 10+ interviews',
    features: [
      'Everything in Pro',
      'Unlimited Mock Interviews',
      'Advanced session analytics',
      'Custom answer style',
      'Dedicated support channel',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px] opacity-15"
          style={{ background: "radial-gradient(ellipse, #F7931A, transparent 70%)" }}
        />
      </div>

      <main className="relative max-w-6xl mx-auto px-4 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F7931A]/30 bg-[#F7931A]/10 text-[#F7931A] text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F7931A] animate-pulse" />
            Simple, honest pricing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Pay once.{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)' }}>
              Ace forever.
            </span>
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            No subscriptions. No hidden fees. Credits never expire — use them at your own pace.
          </p>
        </div>

        {/* Coming soon banner */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-[#F7931A]/20 bg-[#F7931A]/5">
            <span className="text-xl">🚀</span>
            <div>
              <p className="text-white font-semibold text-sm">Payments launching soon</p>
              <p className="text-[#94A3B8] text-xs">Start with 30 free credits — no card needed</p>
            </div>
            <Link
              href="/signup"
              className="ml-4 px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              Get Free Credits →
            </Link>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border p-8 transition-all duration-300 flex flex-col ${
                plan.mostPopular
                  ? 'border-[#F7931A]/60 shadow-[0_0_40px_rgba(247,147,26,0.15)] scale-[1.02]'
                  : 'border-white/8 hover:border-[#F7931A]/30 hover:shadow-[0_0_24px_rgba(247,147,26,0.08)]'
              }`}
              style={{ backgroundColor: '#111827' }}
            >
              {plan.mostPopular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
                >
                  MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.title}</h3>
                <p className="text-[#94A3B8] text-sm">{plan.bestFor}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-[#94A3B8] text-sm mb-1">{plan.gst}</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: plan.mostPopular ? 'rgba(247,147,26,0.15)' : 'rgba(255,255,255,0.05)',
                    color: plan.mostPopular ? '#F7931A' : '#94A3B8',
                  }}
                >
                  🪙 {plan.credits}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: plan.mostPopular
                          ? 'linear-gradient(135deg, #F7931A, #FF6B2B)'
                          : 'rgba(247,147,26,0.15)',
                      }}
                    >
                      <Check size={10} className="text-white" />
                    </div>
                    <span className="text-sm text-[#D1D5DB] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className="w-full py-3.5 rounded-2xl text-center text-sm font-bold transition-all cursor-not-allowed select-none"
                style={
                  plan.mostPopular
                    ? {
                        background: 'linear-gradient(135deg, #F7931A, #FF6B2B)',
                        color: 'white',
                        opacity: 0.7,
                      }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94A3B8',
                      }
                }
              >
                Coming Soon
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison row */}
        <div className="rounded-3xl border border-white/8 bg-[#111827] p-8 mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Everything you get</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🎙️', label: 'Real-time listening', desc: 'Captures questions live' },
              { icon: '🤖', label: 'AI-powered answers', desc: 'Personalized to your resume' },
              { icon: '👁️', label: 'Invisible Mode', desc: 'Screen-share safe overlay' },
              { icon: '🇮🇳', label: 'Desi Mode', desc: 'Indian English + style' },
              { icon: '📄', label: 'Resume parsing', desc: 'Extracts your real experience' },
              { icon: '🎯', label: 'Mock interviews', desc: 'Practice before the real thing' },
              { icon: '📊', label: 'ATS Checker', desc: 'Know your resume score' },
              { icon: '🔒', label: 'Privacy first', desc: 'Nothing stored on servers' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="text-3xl mb-1">{item.icon}</div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-[#94A3B8] text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Do credits expire?',
                a: 'No. Credits never expire. Use them whenever you need — tomorrow or 6 months from now.',
              },
              {
                q: 'How many interviews can I do with 50 credits?',
                a: '1 credit = 1 minute of live AI assistance. 50 credits ≈ 2–3 full interviews (20–25 min each).',
              },
              {
                q: 'Does it work on Zoom, Meet, and Teams?',
                a: 'Yes. InterviewAI works with any video platform. Invisible Mode ensures the AI panel stays hidden from screen share.',
              },
              {
                q: 'Is my resume data secure?',
                a: 'Yes. Resume data is encrypted, tied to your account only, and never used to train AI models.',
              },
              {
                q: 'When will paid plans be available?',
                a: 'Payments are launching soon. Sign up now to get 30 free credits and be first in line when plans go live.',
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-white/8 pb-6 last:border-b-0 last:pb-0">
                <h4 className="text-white font-semibold mb-2">{faq.q}</h4>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="text-center rounded-3xl border border-[#F7931A]/20 bg-[#F7931A]/5 p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to ace your next interview?
          </h2>
          <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
            Start with 30 free credits. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-bold text-white shadow-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(247,147,26,0.4)]"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
          >
            ✨ Start Free Trial →
          </Link>
          <p className="text-[#64748B] text-xs mt-4">No spam. No credit card. Cancel anytime.</p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
