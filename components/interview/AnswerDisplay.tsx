'use client'

interface AnswerDisplayProps {
  answer: string
  isStreaming?: boolean
}

export default function AnswerDisplay({ answer, isStreaming }: AnswerDisplayProps) {
  return (
    <div
      className="min-h-[140px] rounded-xl border p-4"
      style={{
        backgroundColor: 'rgba(34, 197, 94, 0.06)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
      }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
        AI answer
        {isStreaming && (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-normal normal-case text-emerald-300">
            streaming…
          </span>
        )}
      </div>
      {answer ? (
        <div className="whitespace-pre-wrap text-base leading-relaxed" style={{ color: '#4ade80' }}>
          {answer}
        </div>
      ) : (
        <p className="text-sm italic text-zinc-500">Answers stream here after ~1.5s silence following speech.</p>
      )}
    </div>
  )
}
