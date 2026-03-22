'use client'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export default function Skeleton({ width = '100%', height = '1rem', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #1E2A3A 0%, #1E3A5F 50%, #1E2A3A 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
