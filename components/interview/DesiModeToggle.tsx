'use client'

interface DesiModeToggleProps {
  isDesiMode: boolean
  onToggle: () => void
}

export default function DesiModeToggle({ isDesiMode, onToggle }: DesiModeToggleProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
          isDesiMode
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : 'border-zinc-600 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500',
        ].join(' ')}
      >
        <span className="text-lg" aria-hidden>
          🇮🇳
        </span>
        {isDesiMode ? 'Desi Mode' : 'Pro Mode'}
      </button>
      <p className="max-w-[220px] text-[10px] leading-snug text-zinc-500">
        {isDesiMode
          ? '🇮🇳 Switched to Indian English recognition'
          : 'Switched to English (US)'}
      </p>
    </div>
  )
}
