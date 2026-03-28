import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — InterviewAI' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#111827] rounded-3xl p-12 mb-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Terms of Service
          </h1>
          <p className="text-[#94A3B8] text-xl">Last updated: March 1, 2026</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">1</span>
              Acceptance of Terms
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              By using InterviewAI (the "Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">2</span>
              Description of Service
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              InterviewAI is an AI-powered interview assistant tool designed for personal use during job interviews. The Service provides real-time AI suggestions via an invisible overlay window.
            </p>
            <p className="text-[#94A3B8] mb-6">
              The Service is intended for legitimate personal use only. Users are responsible for complying with all applicable laws and company policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">3</span>
              User Accounts
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">4</span>
              Credits and Payments
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              Credits are non-refundable and non-transferable. See our <a href="/refund" className="text-[#F7931A] hover:text-[#FF6B2B] underline">Refund Policy</a> for details.
            </p>
            <ul className="space-y-2 text-[#94A3B8] ml-6">
              <li>• Credits do not expire</li>
              <li>• 1 credit = 1 minute of real-time AI assistance</li>
              <li>• Payments processed securely via Razorpay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">5</span>
              Acceptable Use
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              <strong>You agree not to:</strong>
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6">
              <li>• Resell or redistribute credits or access</li>
              <li>• Use for illegal purposes</li>
              <li>• Abuse the system to generate spam or harmful content</li>
              <li>• Reverse engineer the AI models</li>
              <li>• Share account credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">6</span>
              Intellectual Property
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              InterviewAI owns all intellectual property rights in the Service, including AI models, software, and content. You are granted a limited license for personal use only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">7</span>
              Disclaimer
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              InterviewAI is a tool for interview assistance only. We do not guarantee job offers, interview success, or specific outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">8</span>
              Limitation of Liability
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              To the maximum extent permitted by law, InterviewAI shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">9</span>
              Changes to Terms
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              We may update these Terms from time to time. Continued use of the Service constitutes acceptance of changes.
            </p>
          </section>

          <section className="pt-12 mt-12 border-t border-[#F7931A]/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">10</span>
              Contact
            </h2>
            <div className="bg-gradient-to-r from-[#F7931A]/10 to-[#FF6B2B]/10 p-8 rounded-2xl border border-[#F7931A]/20">
              <p className="text-lg mb-4">
                Questions about our Terms of Service? Email us at:
              </p>
              <a
                href="mailto:legal@interviewai.app"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
              >
                legal@interviewai.app
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
