'use client'

interface AnswerDisplayProps {
  answer: string
  isStreaming?: boolean
  isMobile?: boolean
}

export default function AnswerDisplay({ answer, isStreaming, isMobile }: AnswerDisplayProps) {
  const fontSize = isMobile ? '16px' : '15px'
  const minHeight = isMobile ? '150px' : '160px'
  const maxHeight = isMobile ? '280px' : '300px'
  
  return (
    <div
      style={{
        minHeight,
        maxHeight,
        overflowY: 'auto' as const,
        backgroundColor: 'rgba(67,233,123,0.08)',
        border: '2px solid rgba(67,233,123,0.4)',
        borderLeft: '4px solid #43e97b',
        borderRadius: '12px',
        padding: '14px',
        fontSize,
        lineHeight: '1.7' as const,
        color: '#43e97b',
        whiteSpace: 'pre-wrap' as const,
      }}
    >
      {/* Label removed - shown in parent */}
      {isStreaming && (
        <span style={{
          backgroundColor: 'rgba(67,233,123,0.3)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'normal' as const,
          display: 'inline-block',
          marginBottom: '8px',
        }}>
          streaming…
        </span>
      )}
      {answer ? (
        <div style={{ lineHeight: '1.7' as const }}>
          {answer}
        </div>
      ) : (
        <p style={{ fontSize: '15px', fontStyle: 'italic' as const, color: 'rgba(148,163,184,0.8)' }}>
          Speak a question... AI answer appears here
        </p>
      )}
    </div>
  )
}
