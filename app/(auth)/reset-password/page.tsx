"use client"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  if (!email || !token) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-2">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Invalid reset link</h2>
        <p className="text-[#94A3B8] text-sm">This link is missing required parameters. Please request a new password reset.</p>
        <Link
          href="/forgot-password"
          className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
        >
          Request New Link →
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Reset failed. The link may have expired.")
        return
      }
      setDone(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-2">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Password updated!</h2>
        <p className="text-[#94A3B8] text-sm">Your password has been reset. Redirecting you to sign in…</p>
        <Link
          href="/login"
          className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
        >
          Sign In →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4B5563] text-sm outline-none focus:border-[#F7931A]/50 focus:ring-1 focus:ring-[#F7931A]/30 transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#94A3B8] mb-2">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Repeat your new password"
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
        disabled={loading || !password || !confirm}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
      >
        {loading ? "Updating password…" : "Set New Password →"}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(ellipse, #F7931A, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #F7931A, #FF6B2B)" }}
            >
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
            <p className="text-[#94A3B8] text-sm">Choose a strong password for your account</p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-[#4B5563] text-xs mt-6">
          🔒 Your password is encrypted and never stored in plain text
        </p>
      </div>
    </div>
  )
}
