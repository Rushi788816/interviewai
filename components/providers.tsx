'use client'

import { SessionProvider } from 'next-auth/react'
import ToastContainer from '@/components/shared/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="dark min-h-screen">
        {children}
        <ToastContainer />
      </div>
    </SessionProvider>
  )
}


