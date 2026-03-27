'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const InterviewAssistant = dynamic(() => import('@/components/interview/InterviewAssistant'), {
  ssr: false,
})

export default function LandingInterviewLauncher() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAssistant, setShowAssistant] = useState(false)

  const onClick = () => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    router.push('/interview')
    setShowAssistant(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        style={{
          backgroundImage: 'linear-gradient(90deg, #F7931A, #FF6B2B)',
          boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
        }}
      >
        🎤 Start Interview
      </button>
      {showAssistant && session?.user && (
        <InterviewAssistant showFloatingLauncher={false} defaultOpen />
      )}
    </>
  )
}
