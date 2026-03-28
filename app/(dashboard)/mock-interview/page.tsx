'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { useCredits } from '@/hooks/useCredits'
import MockInterviewSession from '@/components/mock-interview/MockInterviewSession'

export default function MockInterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { balance, isLoading: creditsLoading } = useCredits()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (status !== 'authenticated' || !session?.user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Block access — show friendly gate instead of letting them start and fail mid-session
  if (!creditsLoading && balance < 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-[#111827] border border-white/10 rounded-2xl p-10">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-3xl mx-auto">
            🪙
          </div>
          <h2 className="text-2xl font-bold text-white">Not enough credits</h2>
          <p className="text-[#94A3B8]">
            Mock Interview requires <span className="text-white font-semibold">at least 5 credits</span> to generate questions.
            You currently have <span className="text-amber-400 font-semibold">{balance} credit{balance !== 1 ? 's' : ''}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/settings"
              className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FF6B2B)' }}
            >
              Get More Credits →
            </Link>
            <Link
              href="/interview"
              className="w-full py-3 rounded-xl font-semibold text-[#94A3B8] text-sm border border-white/10 hover:text-white hover:border-[#F7931A]/40 transition-all"
            >
              Try Interview Assistant (Free)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-2 md:p-0">
      <MockInterviewSession userId={session.user.id} credits={balance} />
    </div>
  )
}
