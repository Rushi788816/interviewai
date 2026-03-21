'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useCredits } from '@/hooks/useCredits'

const InterviewAssistant = dynamic(() => import('@/components/interview/InterviewAssistant'), {
  ssr: false,
})

export default function InterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { balance } = useCredits()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status !== 'authenticated' || !session?.user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-1 pb-4">
        <h1 className="text-xl font-bold text-white md:text-2xl">🎤 Interview Assistant</h1>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm text-amber-200">
          {balance} credits
        </span>
      </header>
      {balance < 5 && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
          Low credits! Purchase more to continue.
        </div>
      )}
      <div id="invisible-mode" className="scroll-mt-4">
        <InterviewAssistant
          showFloatingLauncher={false}
          defaultOpen
          userId={session.user.id}
          credits={balance}
        />
      </div>
    </div>
  )
}
