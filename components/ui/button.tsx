"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl",
  outline: "border border-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200",
  ghost: "hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200",
  sm: "px-3 py-1 text-sm"
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants[variant as keyof typeof buttonVariants],
          buttonVariants[size as keyof typeof buttonVariants],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

