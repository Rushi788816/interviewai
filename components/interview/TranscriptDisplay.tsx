 'use client'

interface TranscriptDisplayProps {
  transcript: string
  interimTranscript: string
  isMobile?: boolean
}

export default function TranscriptDisplay({ transcript, interimTranscript, isMobile }: TranscriptDisplayProps) {
  const fontSize = isMobile ? '16px' : '15px'
  const minHeight = isMobile ? '100px' : '120px'
  const maxHeight = isMobile ? '180px' : '200px'
  
  return (
    <div style={{ display: 'flex' as const, flexDirection: 'column' as const, gap: '12px' }}>
      <div style={{ 
        fontSize: '14px',
        fontWeight: '600' as const,
        color: 'rgb(59,130,246)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em' as const,
        marginBottom: '0',
      }}>
        Live transcript
      </div>
      {(transcript || interimTranscript) && (
        <div
          style={{
            minHeight,
            maxHeight,
            overflowY: 'auto' as const,
            backgroundColor: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '12px',
            padding: '14px',
            fontSize,
            color: 'rgb(226,232,240)',
            whiteSpace: 'pre-wrap' as const,
          }}
        >
          {transcript && <span>{transcript}</span>}
          {interimTranscript && (
            <span style={{ color: 'rgb(148,163,184)', fontStyle: 'italic' as const }}>
              {transcript ? ' ' : ''}{interimTranscript}
            </span>
          )}
        </div>
      )}
      {!transcript && !interimTranscript && (
        <div style={{
          border: '2px dashed rgba(148,163,184,0.5)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center' as const,
          fontSize: '15px',
          color: 'rgb(148,163,184)',
          backgroundColor: 'rgba(148,163,184,0.05)',
        }}>
          Speech will appear here. Start the session and use the microphone.
        </div>
      )}
    </div>
  )
}
