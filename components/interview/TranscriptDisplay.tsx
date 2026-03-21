'use client'

interface TranscriptDisplayProps {
  transcript: string
  interimTranscript: string
}

export default function TranscriptDisplay({ transcript, interimTranscript }: TranscriptDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Live transcript</div>
      {(transcript || interimTranscript) && (
        <div
          className="min-h-[100px] rounded-xl border p-4 text-base leading-relaxed text-zinc-100"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderColor: 'rgba(59, 130, 246, 0.25)',
          }}
        >
          {transcript && <span>{transcript}</span>}
          {interimTranscript && (
            <span className="text-zinc-400 italic">{transcript ? ' ' : ''}{interimTranscript}</span>
          )}
        </div>
      )}
      {!transcript && !interimTranscript && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
          Speech will appear here. Start the session and use the microphone.
        </div>
      )}
    </div>
  )
}
