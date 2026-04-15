"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Shared indigo gradient used across the app
const ORANGE_GRADIENT = 'linear-gradient(135deg, #6366F1, #8B5CF6)'

const variantClasses: Record<string, string> = {
  default: "text-white font-semibold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed",
  outline: "border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#6366F1]/40 bg-transparent font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  ghost: "text-[#94A3B8] hover:text-white hover:bg-white/5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  destructive: "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
}

const sizeClasses: Record<string, string> = {
  default: "px-5 py-2.5 rounded-xl text-sm",
  sm: "px-3 py-1.5 rounded-lg text-xs",
  lg: "px-8 py-3.5 rounded-xl text-base",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, style, ...props }, ref) => {
    const isDefault = variant === 'default'
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(variantClasses[variant], sizeClasses[size], "inline-flex items-center justify-center gap-2", className)}
        style={isDefault ? { background: ORANGE_GRADIENT, ...style } : style}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
