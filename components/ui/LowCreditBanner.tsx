'use client'

import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { useState } from 'react'
import { useCredits } from '@/hooks/useCredits'

export default function LowCreditBanner() {
  const { balance, isLoading } = useCredits()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || dismissed || balance > 5) return null

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center gap-3">
      <Zap size={16} className="text-amber-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-amber-200">
        {balance === 0
          ? 'You have no credits left. Buy more to keep using AI answers.'
          : `Only ${balance} credit${balance !== 1 ? 's' : ''} remaining.`}
        {' '}
        <Link href="/credits" className="font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300">
          Buy credits →
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-300 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
