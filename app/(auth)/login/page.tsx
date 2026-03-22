"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🐦</div>
          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "700", marginBottom: "8px" }}>Welcome back</h1>
          <p style={{ color: "#8888aa", fontSize: "0.9rem" }}>Sign in to InterviewAI</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "#8888aa", fontSize: "0.85rem", marginBottom: "8px" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: "100%", background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "#8888aa", fontSize: "0.85rem", marginBottom: "8px" }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: "100%", background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && (
            <div style={{ background: "#ff658422", border: "1px solid #ff658444", borderRadius: "8px", padding: "12px", color: "#ff6584", fontSize: "0.875rem", marginBottom: "16px" }}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: "linear-gradient(135deg, #6c63ff, #9b8fff)", border: "none", borderRadius: "10px", padding: "14px", color: "#fff", fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <p style={{ textAlign: "center", color: "#8888aa", fontSize: "0.875rem", marginTop: "24px" }}>
          No account? <a href="/signup" style={{ color: "#6c63ff", textDecoration: "none", fontWeight: "600" }}>Sign up free</a>
        </p>
      </div>
    </div>
  )
}
