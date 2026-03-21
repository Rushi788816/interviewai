import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 px-5 border-t" style={{ backgroundColor: '#0a0a0f', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐦</span>
              <span
                className="text-lg font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
              >
                InterviewAI
              </span>
            </div>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#8888aa' }}>
              Real-time AI coaching for interviews — private, fast, and human-sounding.
            </p>
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#8888aa' }}
                aria-label="Twitter"
              >
                𝕏
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#8888aa' }}
                aria-label="LinkedIn"
              >
                in
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#8888aa' }}
                aria-label="GitHub"
              >
                ⌘
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/pricing" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/compare" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/blog" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/dashboard" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/help" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:support@interviewai.app" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  support@interviewai.app
                </a>
              </li>
              <li>
                <Link href="/contact" style={{ color: '#8888aa' }} className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t text-sm"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)', color: '#8888aa' }}
        >
          <p>© {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Made with ❤️ in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}
