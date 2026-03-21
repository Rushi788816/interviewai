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
        background: 'linear-gradient(90deg, #1c1c27 0%, #2a2a3a 50%, #1c1c27 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
