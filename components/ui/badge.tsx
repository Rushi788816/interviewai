'use client'

export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={`inline-flex items-center rounded-md border border-white/10 px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
