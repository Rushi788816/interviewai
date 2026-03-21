'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogle = () => {
    void signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })
      if (res?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong')
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
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
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
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6c63ff]"
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-violet-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl border-none bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-violet-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
