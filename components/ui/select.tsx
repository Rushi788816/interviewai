'use client'

import * as React from 'react'

export function Select({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white ${className || ''}`}
      {...props}
    >
      {children}
      <span className="text-zinc-400">▾</span>
    </div>
  )
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`z-50 min-w-[8rem] rounded-md border border-zinc-700 bg-zinc-900 p-1 ${className || ''}`} {...props}>
      {children}
    </div>
  )
)
SelectContent.displayName = 'SelectContent'

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm text-white hover:bg-zinc-800 ${className || ''}`}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = 'SelectItem'

export const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={className} {...props}>
      {children}
    </span>
  )
)
SelectValue.displayName = 'SelectValue'
