'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCredits } from '@/hooks/useCredits'
import { useToast } from '@/hooks/useToast'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { balance, refetch } = useCredits()
  const addToast = useToast((s) => s.addToast)
  const [name, setName] = useState('')
  const [sessions, setSessions] = useState<
    { id: string; createdAt: string; mode: string; duration: number; creditsUsed: number }[]
  >([])

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    setName(session?.user?.name || '')
  }, [session?.user?.name])

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/sessions/recent?limit=20')
      if (res.ok) {
        const j = await res.json()
        setSessions(j.sessions || [])
      }
    })()
  }, [])

  const saveName = async () => {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      await update({})
      addToast('Profile updated', 'success')
    } else addToast('Update failed', 'error')
  }

  const purchase = () => {
    addToast('Razorpay integration coming soon', 'info')
  }

  if (!session?.user) return null

  const initial = (session.user.name || session.user.email || '?')[0].toUpperCase()

  return (
    <div className="mx-auto max-w-4xl space-y-12 text-white">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-2xl border border-white/10 bg-[#16161f] p-8">
        <h2 className="mb-6 text-lg font-semibold">Profile</h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundImage: 'linear-gradient(135deg, #6c63ff, #ff6584)' }}
          >
            {initial}
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-sm text-zinc-400">
              Email: <span className="text-white">{session.user.email}</span>
            </p>
            <span className="inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              Plan: {(session.user as { plan?: string }).plan || 'free'}
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                className="bg-[#0a0a0f] text-white border border-white/10 rounded-lg px-4 py-3 focus:border-[#6c63ff] focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <button
                type="button"
                onClick={saveName}
                className="rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] px-6 py-3 font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#16161f] p-8">
        <h2 className="mb-6 text-lg font-semibold">Credits &amp; Plans</h2>
        <p className="mb-6 text-4xl font-bold">
          🪙 {balance}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Starter', price: '₹499', credits: '50 credits' },
            { title: 'Pro', price: '₹1199', credits: '150 credits', highlight: true },
            { title: 'Power', price: '₹2499', credits: '400 credits' },
          ].map((p) => (
            <div
              key={p.title}
              className={`rounded-2xl border p-6 ${p.highlight ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-white/10'}`}
            >
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-2xl font-bold">{p.price}</p>
              <p className="text-sm text-zinc-400">{p.credits}</p>
              <button
                type="button"
                onClick={purchase}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#9b8fff] py-2 text-sm font-semibold"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#16161f] p-8">
        <h2 className="mb-6 text-lg font-semibold">Session History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Type</th>
                <th className="py-2">Duration</th>
                <th className="py-2">Credits</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="py-2">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="py-2 capitalize">{s.mode}</td>
                  <td className="py-2">{Math.round(s.duration / 60)} min</td>
                  <td className="py-2">{s.creditsUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/40 bg-red-950/20 p-8">
        <h2 className="mb-4 text-lg font-semibold text-red-300">Danger Zone</h2>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="rounded-xl border border-red-500 px-6 py-3 font-semibold text-red-300"
        >
          Sign Out
        </button>
      </section>
    </div>
  )
}
