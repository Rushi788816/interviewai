'use client'

interface MicrophoneButtonProps {
  isListening: boolean
  onToggle: () => void
  disabled?: boolean
  isMobile?: boolean
}

export default function MicrophoneButton({ isListening, onToggle, disabled, isMobile }: MicrophoneButtonProps) {
  const size = isMobile ? 64 : 56
  
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.3), 0 8px 24px rgba(239,68,68,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        backgroundColor: isListening ? 'rgb(239,68,68)' : 'rgb(55,65,81)',
        ...(isListening && {
          animation: 'pulse 1.5s infinite',
          boxShadow: '0 0 0 0 rgb(239,68,68), 0 8px 24px rgba(239,68,68,0.4)',
        }),
      }}
      aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
    >
      {isListening ? '🎤' : '🎙️'}
    </button>
  )
}
