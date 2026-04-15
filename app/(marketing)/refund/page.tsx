import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Refund Policy — InterviewAI' }

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#111827] rounded-3xl p-12 mb-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Refund Policy
          </h1>
          <p className="text-[#94A3B8] text-xl">Last updated: March 1, 2026</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 p-8 rounded-2xl border border-[#6366F1]/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#6366F1]/30 border-2 border-[#6366F1]/50 flex items-center justify-center text-white text-sm font-bold">✓</span>
                When you're eligible
              </h2>
              <ul className="space-y-3 text-[#94A3B8] ml-6">
                <li>• Within <strong>7 days</strong> of purchase</li>
                <li>• Less than <strong>5 credits used</strong></li>
                <li>• Complete or partial refund based on unused credits</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-orange-400/10 p-8 rounded-2xl border border-orange-500/20">
              <h2 className="text-2xl font-bold mb-4 text-orange-300 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-orange-500/30 border-2 border-orange-500/50 flex items-center justify-center text-white text-sm font-bold">✗</span>
                Non-refundable
              </h2>
              <ul className="space-y-3 text-orange-200 ml-6">
                <li>• Credits already used (5+)</li>
                <li>• Purchases older than 7 days</li>
                <li>• Digital products after download/access</li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#111827]/50 p-8 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold mb-4">How to request a refund</h3>
              <ol className="space-y-2 text-[#94A3B8] list-decimal list-inside ml-4">
                <li>Check your <strong>credit balance</strong> in Settings</li>
                <li>Email <a href="mailto:support@interviewai.app" className="text-[#6366F1] hover:text-[#8B5CF6]">support@interviewai.app</a></li>
                <li>Include your <strong>order ID</strong> and <strong>email address</strong></li>
                <li>Explain reason (optional)</li>
                <li>Wait 1-2 business days for review</li>
              </ol>
            </div>

            <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20">
              <h4 className="font-bold mb-2 flex items-center gap-2 text-emerald-300">
                ⏱️ Processing Time
              </h4>
              <p className="text-emerald-200">
                Approved refunds processed in <strong>5-7 business days</strong> to original payment method
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#6366F1]/5 to-[#8B5CF6]/5 p-10 rounded-3xl border border-[#6366F1]/20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Need Help?</h2>
            <p className="text-[#94A3B8] mb-8 text-lg">
              Questions about refunds or credits? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="mailto:support@interviewai.app"
                className="flex-1 max-w-md inline-flex items-center justify-center gap-3 px-8 py-4 text-white rounded-2xl font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                📧 Email Support
              </a>
              <a
                href="/contact"
                className="flex-1 max-w-md px-8 py-4 border border-[#94A3B8]/50 rounded-2xl text-[#94A3B8] font-semibold hover:bg-[#111827] hover:border-[#6366F1]/50 hover:text-[#6366F1] transition-all"
              >
                Contact Form
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
