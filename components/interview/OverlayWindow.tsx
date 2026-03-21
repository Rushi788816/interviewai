'use client'

interface OverlayWindowProps {
  children: React.ReactNode
}

export default function OverlayWindow({ children }: OverlayWindowProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
    >
      <div
        className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: '#0f0f14',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
