'use client'

import { useState } from 'react'

export interface EvalItem {
  question: string
  userAnswer?: string
  clarity: number
  relevance: number
  structure: number
  feedback: string
  betterAnswer: string
}

export default function FeedbackReport({
  overall,
  items,
  onTryAgain,
  onSave,
}: {
  overall: number
  items: EvalItem[]
  onTryAgain: () => void
  onSave: () => void
}) {
  const [open, setOpen] = useState<number | null>(0)

  const avg = (i: EvalItem) =>
    Math.round((i.clarity + i.relevance + i.structure) / 3)

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-white">
      <h2 className="text-center text-3xl font-bold">🎉 Interview Complete!</h2>

      <div className="flex justify-center">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-violet-500 text-3xl font-bold"
          style={{
            background: `conic-gradient(#F7931A ${overall * 3.6}deg, #1c1c27 0deg)`,
          }}
        >
          <span className="flex h-32 w-32 items-center justify-center rounded-full bg-[#0a0a0f] text-2xl">
            {overall}%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#16161f] text-zinc-400">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Clarity</th>
              <th className="px-3 py-2">Relevance</th>
              <th className="px-3 py-2">Structure</th>
              <th className="px-3 py-2">Avg</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="h-2 w-full rounded bg-zinc-700">
                    <div className="h-2 rounded bg-violet-500" style={{ width: `${it.clarity}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="h-2 w-full rounded bg-zinc-700">
                    <div className="h-2 rounded bg-violet-500" style={{ width: `${it.relevance}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="h-2 w-full rounded bg-zinc-700">
                    <div className="h-2 rounded bg-violet-500" style={{ width: `${it.structure}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2">{avg(it)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Improvement Areas</h3>
        <ul className="list-inside list-disc space-y-1 text-zinc-300">
          {items.map((it, i) => (
            <li key={i}>{it.feedback.slice(0, 120)}…</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Sample Better Answers</h3>
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-[#16161f]">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
              onClick={() => setOpen(open === i ? null : i)}
            >
              Question {i + 1}
              <span>{open === i ? '▲' : '▼'}</span>
            </button>
            {open === i && (
              <div className="border-t border-white/10 px-4 py-3 text-sm text-zinc-300">{it.betterAnswer}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-xl bg-gradient-to-r from-[#F7931A] to-[#FF6B2B] px-6 py-3 font-semibold text-white"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl border border-white/20 bg-[#16161f] px-6 py-3 font-semibold text-white"
        >
          Save Results
        </button>
      </div>
    </div>
  )
}
