import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

export const metadata = { title: 'Privacy Policy — InterviewAI' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#111827] rounded-3xl p-12 mb-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Privacy Policy
          </h1>
          <p className="text-[#94A3B8] text-xl">Last updated: March 1, 2026</p>
        </div>

        <div className="space-y-12">
          {[
            {
              n: '1', title: 'Information We Collect',
              body: 'We collect minimal information to provide our service:',
              items: [
                'Email address and name (for account management)',
                'Usage data (interview session duration, credits used)',
                'Interview session metadata (no audio or video stored)',
                'Resume data (when using Resume Builder, stored securely)',
              ],
              note: 'We never store or record your actual interview audio or conversations.'
            },
            {
              n: '2', title: 'How We Use Your Information',
              body: 'Your information is used only to:',
              items: [
                'Provide and improve our AI interview service',
                'Generate better AI responses based on anonymized patterns',
                'Send important service updates and billing information',
                'Comply with legal obligations',
              ]
            },
            {
              n: '3', title: 'Data Storage',
              body: 'All data is stored securely on Supabase servers with:',
              items: [
                'Encryption at rest and in transit (TLS 1.3)',
                'GDPR and CCPA compliant infrastructure',
                'Regular security audits',
                '90-day deletion policy for inactive accounts',
              ]
            },
            {
              n: '4', title: 'Data Sharing',
              body: 'We never sell your data or share it with advertisers.',
              items: [
                'Shared only with service providers (Supabase, Groq AI, Razorpay)',
                'Under strict data processing agreements',
                'No sharing with third parties for marketing',
              ]
            },
            {
              n: '5', title: 'Cookies',
              body: 'We use only essential cookies for:',
              items: [
                'Authentication (NextAuth.js session cookies)',
                'Security (CSRF protection)',
                'Basic analytics (no personal identification)',
              ]
            },
            {
              n: '6', title: 'Your Rights',
              items: [
                'Access: View your data anytime in Settings',
                'Delete: Request full account deletion',
                'Export: Download your resume data and session history',
                'Rectification: Update your profile information',
                'Withdraw consent: Delete your account',
              ]
            },
          ].map(({ n, title, body, items, note }) => (
            <section key={n}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">{n}</span>
                {title}
              </h2>
              {body && <p className="text-[#94A3B8] leading-relaxed mb-4">{body}</p>}
              <ul className="space-y-3 text-[#94A3B8] ml-6">
                {items.map((item, i) => <li key={i}>• {item}</li>)}
              </ul>
              {note && <p className="text-[#94A3B8] mt-6">{note}</p>}
            </section>
          ))}

          <section className="pt-12 mt-12 border-t border-[#F7931A]/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#F7931A]/20 border-2 border-[#F7931A]/50 flex items-center justify-center text-sm font-bold text-[#F7931A]">7</span>
              Contact
            </h2>
            <div className="bg-gradient-to-r from-[#F7931A]/10 to-[#FF6B2B]/10 p-8 rounded-2xl border border-[#F7931A]/20">
              <p className="text-lg mb-4">
                Questions about our Privacy Policy? Email us at:
              </p>
              <a
                href="mailto:privacy@interviewai.app"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
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
