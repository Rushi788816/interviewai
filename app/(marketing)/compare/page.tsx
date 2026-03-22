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
          <div className="text-3xl font-bold text-[#2563EB] mb-4">
            Save up to <span className="text-[#0EA5E9]">85%</span> compared to other AI interview tools
          </div>
        </div>

        <div className="overflow-x-auto mb-20">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#111827]">
                <th className="py-4 px-4 font-semibold text-white w-56">Feature</th>
                <th className="py-4 px-4 font-semibold text-[#2563EB] border-l border-[#2563EB]/20 bg-[#111827] relative">
                  <div className="inline-flex items-center gap-1 bg-[#2563EB]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#2563EB]/30">
                    InterviewAI
                    <span className="text-xs font-bold text-white bg-[#2563EB] rounded-full px-2 py-0.5">Most Affordable</span>
                  </div>
                </th>
                <th className="py-4 px-4 font-semibold text-zinc-400">Parakeet AI</th>
                <th className="py-4 px-4 font-semibold text-zinc-400">Final Round AI</th>
                <th className="py-4 px-4 font-semibold text-zinc-400">LockedIn AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111827]">
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
                  <td className="py-4 px-4 border-l border-[#2563EB]/20 bg-[#111827]/50">{row[1]}</td>
                  <td className="py-4 px-4">{row[2]}</td>
                  <td className="py-4 px-4">{row[3]}</td>
                  <td className="py-4 px-4">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="rounded-2xl border border-white/10 p-8 text-center group hover:border-[#2563EB]/50 transition-all">
            <div className="text-3xl mb-4 font-bold text-[#2563EB]">55%</div>
            <h3 className="text-xl font-bold mb-2">vs Parakeet AI</h3>
            <p className="text-[#94A3B8] mb-6">Same features, <span className="text-[#2563EB]">55% cheaper</span></p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent group-hover:w-full transition-all" />
          </div>
          <div className="rounded-2xl border border-white/10 p-8 text-center group hover:border-[#2563EB]/50 transition-all">
            <div className="text-3xl mb-4 font-bold text-[#2563EB]">85%</div>
            <h3 className="text-xl font-bold mb-2">vs Final Round AI</h3>
            <p className="text-[#94A3B8] mb-6">More features, <span className="text-[#2563EB]">85% cheaper</span></p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent group-hover:w-full transition-all" />
          </div>
          <div className="rounded-2xl border border-white/10 p-8 text-center group hover:border-[#2563EB]/50 transition-all">
            <div className="text-3xl mb-4 font-bold text-[#2563EB]">81%</div>
            <h3 className="text-xl font-bold mb-2">vs LockedIn AI</h3>
            <p className="text-[#94A3B8] mb-6">India pricing, <span className="text-[#2563EB]">81% cheaper</span></p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent group-hover:w-full transition-all" />
          </div>
          <div className="rounded-2xl border border-white/10 p-8 text-center group hover:border-[#2563EB]/50 transition-all">
            <div className="text-3xl mb-4 font-bold text-[#2563EB]">75%</div>
            <h3 className="text-xl font-bold mb-2">vs Interview Warmup</h3>
            <p className="text-[#94A3B8] mb-6">More features, <span className="text-[#2563EB]">75% cheaper</span></p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent group-hover:w-full transition-all" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to switch?</h2>
          <p className="text-xl text-[#94A3B8] mb-8 max-w-2xl mx-auto">
            Get started with 30 free credits. No credit card required.
          </p>
          <a href="/login"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-xl font-bold text-white shadow-2xl hover:shadow-blue-500/25 transition-all"
          >
            Start Free →
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
