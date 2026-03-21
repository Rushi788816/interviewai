'use client'

interface CreditsBadgeProps {
  balance?: number
  className?: string
}

export function CreditsBadge({ balance = 0, className = '' }: CreditsBadgeProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-200">
        {balance} credits
      </span>
    </div>
  )
}
