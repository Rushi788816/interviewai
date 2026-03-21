'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'

interface UseCreditsReturn {
  balance: number
  isLoading: boolean
  error: string | null
  deductCredits: (amount: number, reason: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useCredits(): UseCreditsReturn {
  const { data: session, status } = useSession()
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (status === 'loading') return
    if (!session?.user) {
      setBalance(0)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/credits/balance')
      if (!response.ok) {
        throw new Error('Failed to fetch credits')
      }
      const data = await response.json()
      setBalance(data.credits ?? 0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [session, status])

  useEffect(() => {
    void fetchBalance()
  }, [fetchBalance])

  const deductCredits = async (amount: number, reason: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as { message?: string }).message || 'Deduction failed')
      }

      await fetchBalance()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deduction failed')
      return false
    }
  }

  return {
    balance,
    isLoading,
    error,
    deductCredits,
    refetch: fetchBalance,
  }
}
