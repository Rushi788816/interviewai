'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleGoogle = () => {
    void signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: string[] = []
    if (password.length < 6) next.push('Password must be at least 6 characters')
    if (password !== confirm) next.push('Passwords do not match')
    if (next.length) {
      setErrors(next)
      return
    }
    setErrors([])
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors([data.error || 'Registration failed'])
        setLoading(false)
        return
      }
      const sign = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })
      if (sign?.error) {
        setErrors(['Account created but sign-in failed. Please log in manually.'])
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setErrors(['Something went wrong'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ backgroundColor: '#0a0a0f' }}>
      <div
        className="w-full max-w-md rounded-2xl border p-10"
        style={{
          backgroundColor: '#16161f',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="mb-8 text-center">
          <div
            className="mb-2 text-2xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #6c63ff, #ff6584)' }}
          >
            🐦 InterviewAI
          </div>
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100"
        >
          <span className="font-bold text-lg">G</span>
          Continue with Google
        </button>

        <div className="relative mb-6 text-center">
          <span className="relative z-10 bg-[#16161f] px-3 text-sm text-zinc-500">or continue with email</span>
          <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <ul className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <input
            type="password"
            required
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl border-none bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
