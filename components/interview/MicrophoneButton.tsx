'use client'

interface MicrophoneButtonProps {
  isListening: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function MicrophoneButton({ isListening, onToggle, disabled }: MicrophoneButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl transition-all',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        isListening
          ? 'animate-pulse bg-red-600 shadow-lg shadow-red-500/40 ring-2 ring-red-400/50'
          : 'bg-zinc-700 hover:bg-zinc-600',
      ].join(' ')}
      aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
    >
      {isListening ? '🎤' : '🎙️'}
    </button>
  )
}
