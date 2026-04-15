"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.")
        setLoading(false)
        return
      }
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        router.push("/login")
      } else {
        router.push("/onboarding")
      }
    } catch {
      setError("Something went wrong. Try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[130px] opacity-15"
          style={{ background: "radial-gradient(ellipse, #6366F1, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🐦</span>
            <span className="text-2xl font-bold text-white">
              Interview<span style={{ color: '#6366F1' }}>AI</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-[#94A3B8] text-sm">
            Get{" "}
            <span className="font-semibold" style={{ color: '#6366F1' }}>30 free credits</span>{" "}
            on signup — no credit card needed
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Google button */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-medium text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.68-2.7.68-2.07 0-3.82-1.4-4.45-3.27H1.86v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.53 10.46A4.8 4.8 0 0 1 4.28 9c0-.51.09-1 .25-1.46V5.47H1.86A8 8 0 0 0 .98 9c0 1.29.31 2.51.88 3.57l2.67-2.11z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.12 4.47l2.67 2.07c.63-1.87 2.38-3.96 4.45-3.96z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#64748B]">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[#94A3B8] mb-2">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#94A3B8] mb-2">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#94A3B8] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" size="lg" loading={loading} className="w-full font-bold">
              Create Free Account →
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🪙", label: "30 free credits" },
              { icon: "🔒", label: "No card needed" },
              { icon: "⚡", label: "Instant access" },
            ].map((b, i) => (
              <div key={i} className="bg-white/3 rounded-xl py-2.5 px-2">
                <div className="text-base mb-0.5">{b.icon}</div>
                <div className="text-[#94A3B8] text-xs font-medium">{b.label}</div>
              </div>
            ))}
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-[#94A3B8] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#6366F1' }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[#4B5563] text-xs mt-6">
          By signing up, you agree to our{" "}
          <span className="text-[#64748B] hover:text-[#94A3B8] cursor-pointer">Terms</span> and{" "}
          <span className="text-[#64748B] hover:text-[#94A3B8] cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
