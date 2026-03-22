'use client'

interface OverlayWindowProps {
  children: React.ReactNode
}

export default function OverlayWindow({ children }: OverlayWindowProps) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      overflowY: "auto",
    }}>
      <div style={{
        background: "#111827",
        border: "1px solid rgba(37,99,235,0.3)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "780px",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
      }}>
        {children}
      </div>
    </div>
  )
}
