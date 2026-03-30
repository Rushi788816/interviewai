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
          style={{ background: "radial-gradient(ellipse, #F7931A, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🐦</span>
            <span
              className="text-2xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #F7931A, #FF6B2B)" }}
            >
              InterviewAI
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-[#94A3B8] text-sm">
            Get{" "}
            <span className="text-[#F7931A] font-semibold">30 free credits</span>{" "}
            on signup — no credit card needed
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">
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
                className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#F7931A]/50 focus:ring-1 focus:ring-[#F7931A]/30 transition-all"
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
                className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#F7931A]/50 focus:ring-1 focus:ring-[#F7931A]/30 transition-all"
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
                  className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#F7931A]/50 focus:ring-1 focus:ring-[#F7931A]/30 transition-all"
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
            <Link href="/login" className="text-[#F7931A] font-semibold hover:underline">
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
