"use client"

import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useState } from 'react'

export default function PricingPage() {
  const [plan, setPlan] = useState<'starter' | 'pro' | 'power'>('pro')

  const pricingPlans = [
    {
      id: 'starter',
      title: 'Starter',
      price: '₹499 + GST',
      credits: '50 credits',
      bestFor: '1-2 interviews',
      features: [
        'Real-time AI answers',
        'All interview types (Technical, Behavioral, Coding)',
        '52+ languages',
        'Invisible Mode',
        'Credits never expire'
      ]
    },
    {
      id: 'pro',
      title: 'Pro',
      price: '₹1,199 + GST',
      credits: '150 credits',
      bestFor: '4-5 interviews',
      mostPopular: true,
      features: [
        'Everything in Starter',
        'Desi Mode 🇮🇳',
        'AI Mock Interview (3 sessions)',
        'Resume AI Enhancement',
        'ATS Score Checker',
        'Priority support'
      ]
    },
    {
      id: 'power',
      title: 'Power',
      price: '₹2,499 + GST',
      credits: '400 credits',
      bestFor: '10+ interviews',
      features: [
        'Everything in Pro',
        'Unlimited Mock Interviews',
        'Advanced session analytics',
        'Custom answer style',
        'Dedicated support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Simple, Honest Pricing
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-12">
            No subscriptions. No hidden fees. Credits never expire.
          </p>
          <div className="flex justify-center gap-2 mb-16">
            <button
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${plan === 'starter' ? 'bg-[#2563EB] text-white' : 'bg-[#111827] text-[#94A3B8] hover:bg-[#2563EB]/20'}`}
              onClick={() => setPlan('starter')}
            >
              One-time
            </button>
            <button
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${plan === 'pro' ? 'bg-[#2563EB] text-white' : 'bg-[#111827] text-[#94A3B8] hover:bg-[#2563EB]/20'}`}
              onClick={() => setPlan('pro')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pricingPlans.map((p) => (
            <div 
              key={p.id}
              className={`relative rounded-3xl border p-8 text-center transition-all group hover:shadow-2xl hover:shadow-[#2563EB]/25 ${
                p.mostPopular 
                  ? 'border-[#2563EB] ring-4 ring-[#2563EB]/20 scale-[1.02]' 
                  : 'border-[#111827] hover:border-[#2563EB]/50'
              }`}
            >
              {p.mostPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold mb-4">{p.title}</h3>
              <div className="text-4xl font-bold mb-4 text-[#2563EB]">{p.price}</div>
              <div className="text-lg mb-8 opacity-75">{p.credits}</div>
              <p className="text-[#94A3B8] mb-8 font-medium">{p.bestFor}</p>
              <ul className="space-y-3 mb-12 text-left">
                {p.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB]/20 border-2 border-[#2563EB]/50" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                p.mostPopular 
                  ? 'bg-[#2563EB] text-white shadow-lg hover:shadow-[#2563EB]/50 hover:scale-[1.02]' 
                  : 'bg-[#111827] text-[#94A3B8] border border-[#94A3B8]/30 hover:bg-[#2563EB]/10 hover:text-[#2563EB] hover:border-[#2563EB]/50'
              }`}>
                Get {p.title}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-[#111827] rounded-3xl p-12 mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-8 max-w-3xl mx-auto">
              {[
                {
                  q: 'Do credits expire?',
                  a: 'No. Your credits never expire. Use them whenever you need them, whether that is tomorrow or 6 months from now.'
                },
                {
                  q: 'How many interviews can I do with 50 credits?',
                  a: 'The Interview Assistant uses 1 credit per minute. 50 credits = approximately 50 minutes of live interview assistance, which is typically 2-3 full interviews.'
                },
                {
                  q: 'Can I use InterviewAI on Zoom and Google Meet?',
                  a: 'Yes. InterviewAI works with any video platform including Zoom, Google Meet, Microsoft Teams, Webex, and any other platform. Our Invisible Mode ensures the AI panel never appears on screen share.'
                },
                {
                  q: 'Is my data secure?',
                  a: 'Yes. We use encrypted connections and never store your interview conversations. Your resume data is stored securely and only accessible to you.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit/debit cards, UPI, Net Banking, and wallets via Razorpay.'
                },
                {
                  q: 'Can I get a refund?',
                  a: 'We offer refunds within 7 days if you have not used more than 5 credits. Contact support@interviewai.app for refund requests.'
                }
              ].map((faq, i) => (
                <div key={i} className="border-b border-[#2563EB]/20 pb-8 last:border-b-0">
                  <h4 className="text-xl font-semibold mb-3">{faq.q}</h4>
                  <p className="text-[#94A3B8] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Ace Your Interview?</h2>
          <p className="text-xl text-[#94A3B8] mb-8 max-w-2xl mx-auto">
            Start with 30 free credits today. No credit card required.
          </p>
          <a href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-xl font-bold text-white shadow-2xl hover:shadow-[#2563EB]/50 transition-all"
          >
            Start Free Trial →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
