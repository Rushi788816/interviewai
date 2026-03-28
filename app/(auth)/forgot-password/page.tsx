"use client"
import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const d = await res.json()
        setError(d.error || "Something went wrong. Try again.")
      }
    } catch {
      // Show success even on network error to avoid email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(ellipse, #F7931A, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}>
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
            <p className="text-[#94A3B8] text-sm">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-2">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Check your inbox</h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                If <span className="text-white font-medium">{email}</span> is registered, you&apos;ll receive a password reset link shortly.
              </p>
              <p className="text-[#64748B] text-xs">
                Didn&apos;t get it? Check your spam folder or{" "}
                <button
                  onClick={() => { setSent(false); setEmail("") }}
                  className="text-[#F7931A] hover:underline"
                >
                  try again
                </button>
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 mt-4"
                style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#F7931A]/50 focus:ring-1 focus:ring-[#F7931A]/30 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
              >
                {loading ? "Sending reset link…" : "Send Reset Link →"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-[#94A3B8] hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[#4B5563] text-xs mt-6">
          🔒 We&apos;ll never share your email with anyone
        </p>
      </div>
    </div>
  )
}
