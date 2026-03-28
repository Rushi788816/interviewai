"use client"

import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            InterviewAI vs Competitors
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-3xl mx-auto mb-8">
            See why thousands of candidates choose InterviewAI over expensive alternatives
          </p>
          <div className="text-3xl font-bold bg-gradient-to-r from-[#F7931A] to-[#FF6B2B] bg-clip-text text-transparent mb-4">
            Save up to <span>85%</span> compared to other AI interview tools
          </div>
        </div>

        <div className="overflow-x-auto mb-20">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 font-semibold text-white w-56">Feature</th>
                <th className="py-4 px-4 font-semibold text-[#F7931A] border-l border-[#F7931A]/20 bg-[#111827] relative">
                  <div className="inline-flex items-center gap-1 bg-[#F7931A]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#F7931A]/30">
                    InterviewAI
                    <span className="text-xs font-bold text-white bg-[#F7931A] rounded-full px-2 py-0.5">Most Affordable</span>
                  </div>
                </th>
                <th className="py-4 px-4 font-semibold text-zinc-400">Parakeet AI</th>
                <th className="py-4 px-4 font-semibold text-zinc-400">Final Round AI</th>
                <th className="py-4 px-4 font-semibold text-zinc-400">LockedIn AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {[
                ['Price per month', '₹1,199 (one-time)', '₹2,650/mo', '₹8,188/mo', '₹6,213/mo'],
                ['Credits expire', 'Never', 'Monthly', 'Monthly', 'Monthly'],
                ['Real-time answers', '✅', '✅', '✅', '✅'],
                ['Desi Mode (Indian English)', '✅', '❌', '❌', '❌'],
                ['Invisible Mode', '✅', '✅', '✅', '✅'],
                ['52+ Languages', '✅', '❌', '✅', '❌'],
                ['Mock Interview', '✅', '❌', '✅', '❌'],
                ['Resume Builder', '✅', '❌', '❌', '❌'],
                ['India pricing (INR)', '✅', '❌', '❌', '❌'],
                ['Free trial', '✅ 30 credits', '❌', '✅ Limited', '❌']
              ].map((row, index) => (
                <tr key={index}>
                  <td className="py-4 px-4 text-[#94A3B8] font-medium">{row[0]}</td>
                  <td className="py-4 px-4 border-l border-[#F7931A]/20 bg-[#111827]/50">{row[1]}</td>
                  <td className="py-4 px-4">{row[2]}</td>
                  <td className="py-4 px-4">{row[3]}</td>
                  <td className="py-4 px-4">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { pct: '55%', vs: 'Parakeet AI', desc: 'Same features' },
            { pct: '85%', vs: 'Final Round AI', desc: 'More features' },
            { pct: '81%', vs: 'LockedIn AI', desc: 'India pricing' },
            { pct: '75%', vs: 'Interview Warmup', desc: 'More features' },
          ].map(({ pct, vs, desc }) => (
            <div key={vs} className="rounded-2xl border border-white/10 p-8 text-center group hover:border-[#F7931A]/50 transition-all">
              <div className="text-3xl mb-4 font-bold text-[#F7931A]">{pct}</div>
              <h3 className="text-xl font-bold mb-2">vs {vs}</h3>
              <p className="text-[#94A3B8] mb-6">{desc}, <span className="text-[#F7931A]">{pct} cheaper</span></p>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#F7931A]/50 to-transparent" />
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to switch?</h2>
          <p className="text-xl text-[#94A3B8] mb-8 max-w-2xl mx-auto">
            Get started with 30 free credits. No credit card required.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold text-white shadow-2xl hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)', boxShadow: '0 0 40px rgba(247,147,26,0.25)' }}
          >
            Start Free →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
