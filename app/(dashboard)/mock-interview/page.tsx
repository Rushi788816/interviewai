'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useCredits } from '@/hooks/useCredits'
import MockInterviewSession from '@/components/mock-interview/MockInterviewSession'

export default function MockInterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { balance } = useCredits()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (status !== 'authenticated' || !session?.user) {
    return <div className="text-zinc-500">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-2 md:p-0">
      {balance < 5 && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
          You need at least 5 credits for a mock interview.
        </div>
      )}
      <MockInterviewSession userId={session.user.id} credits={balance} />
    </div>
  )
}
