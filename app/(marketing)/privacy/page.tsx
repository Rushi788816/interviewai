import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#111827] rounded-3xl p-12 mb-12 border border-rgba(37,99,235,0.2)">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Privacy Policy
          </h1>
          <p className="text-[#94A3B8] text-xl">Last updated: March 1, 2026</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">1</span>
              Information We Collect
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              We collect minimal information to provide our service:
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6">
              <li>• Email address and name (for account management)</li>
              <li>• Usage data (interview session duration, credits used)</li>
              <li>• Interview session metadata (no audio or video stored)</li>
              <li>• Resume data (when using Resume Builder, stored securely)</li>
            </ul>
            <p className="text-[#94A3B8] mt-6">
              We never store or record your actual interview audio or conversations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">2</span>
              How We Use Your Information
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              Your information is used only to:
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6 mt-4">
              <li>• Provide and improve our AI interview service</li>
              <li>• Generate better AI responses based on anonymized patterns</li>
              <li>• Send important service updates and billing information</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">3</span>
              Data Storage
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              All data is stored securely on Supabase servers with:
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6 mt-4">
              <li>• Encryption at rest and in transit (TLS 1.3)</li>
              <li>• GDPR and CCPA compliant infrastructure</li>
              <li>• Regular security audits</li>
              <li>• 90-day deletion policy for inactive accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">4</span>
              Data Sharing
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              <strong>We never sell your data or share it with advertisers.</strong>
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6">
              <li>• Shared only with service providers (Supabase, Anthropic AI, Razorpay)</li>
              <li>• Under strict data processing agreements</li>
              <li>• No sharing with third parties for marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">5</span>
              Cookies
            </h2>
            <p className="text-[#94A3B8] leading-relaxed">
              We use only <strong>essential cookies</strong> for:
            </p>
            <ul className="space-y-3 text-[#94A3B8] ml-6 mt-4">
              <li>• Authentication (NextAuth.js session cookies)</li>
              <li>• Security (CSRF protection)</li>
              <li>• Basic analytics (no personal identification)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">6</span>
              Your Rights
            </h2>
            <ul className="space-y-3 text-[#94A3B8] ml-6">
              <li>• <strong>Access:</strong> View your data anytime in Settings</li>
              <li>• <strong>Delete:</strong> Request full account deletion</li>
              <li>• <strong>Export:</strong> Download your resume data and session history</li>
              <li>• <strong>Rectification:</strong> Update your profile information</li>
              <li>• <strong>Withdraw consent:</strong> Delete your account</li>
            </ul>
          </section>

          <section className="pt-12 mt-12 border-t border-[#2563EB]/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border-2 border-[#2563EB]/50 flex items-center justify-center text-sm font-bold text-[#2563EB]">7</span>
              Contact
            </h2>
            <div className="bg-gradient-to-r from-[#2563EB]/10 to-[#0EA5E9]/10 p-8 rounded-2xl border border-[#2563EB]/20">
              <p className="text-lg mb-4">
                Questions about our Privacy Policy? Email us at:
              </p>
              <a 
                href="mailto:privacy@interviewai.app" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl font-semibold hover:bg-[#0EA5E9] transition-all"
              >
                privacy@interviewai.app
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
