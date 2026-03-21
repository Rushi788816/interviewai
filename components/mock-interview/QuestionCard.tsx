'use client'

import { useEffect, useState } from 'react'

export default function QuestionCard({
  index,
  total,
  question,
  recording,
}: {
  index: number
  total: number
  question: string
  recording: boolean
}) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!recording) {
      setSecs(0)
      return
    }
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [recording])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="space-y-4">
      <div className="inline-block rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
        Question {index} of {total}
      </div>
      <div className="border-l-4 border-violet-500 bg-[#16161f] p-6 text-lg leading-relaxed text-white">
        {question}
      </div>
      {recording && (
        <p className="font-mono text-sm text-zinc-400">
          Recording timer: {mm}:{ss}
        </p>
      )}
    </div>
  )
}
