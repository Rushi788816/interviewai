import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InterviewAI - AI Interview Assistant',
  description: 'Real-time AI interview coaching — private answers, mock interviews, and resume tools.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} bg-[#0a0a0f] text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
