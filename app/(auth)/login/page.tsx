"use client"
import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Invalid email or password")
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#111827", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🐦</div>
          <h1 style={{ color: "#fff", fontSize: "1.6rem", fontWeight: "800", marginBottom: "8px" }}>Welcome back</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Sign in to InterviewAI</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "500" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: "100%", background: "#0A0F1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: "0.85rem", marginBottom: "8px", fontWeight: "500" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: "100%", background: "#0A0F1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px", color: "#FCA5A5", fontSize: "0.875rem", marginBottom: "16px" }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: "linear-gradient(135deg, #2563EB, #0EA5E9)", border: "none", borderRadius: "10px", padding: "14px", color: "#fff", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In to InterviewAI →"}
          </button>
        </form>
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.875rem", marginTop: "24px" }}>
          No account? <a href="/signup" style={{ color: "#2563EB", textDecoration: "none", fontWeight: "600" }}>Create one free →</a>
        </p>
        <p style={{ textAlign: "center", color: "#64748B", fontSize: "0.75rem", marginTop: "12px" }}>
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0A0F1E" }} />}>
      <LoginForm />
    </Suspense>
  )
}
