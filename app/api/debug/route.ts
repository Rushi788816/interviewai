import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {}
  results.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "MISSING"
  results.NEXTAUTH_SECRET_present = !!process.env.NEXTAUTH_SECRET
  results.DATABASE_URL_present = !!process.env.DATABASE_URL
  results.GROQ_API_KEY_present = !!process.env.GROQ_API_KEY
  results.NODE_ENV = process.env.NODE_ENV

  try {
    const { prisma } = await import('@/lib/prisma')
    const userCount = await prisma.user.count()
    results.database = "CONNECTED"
    results.userCount = userCount
  } catch (error: any) {
    results.database = "FAILED"
    results.databaseError = error.message
  }

  return NextResponse.json(results)
}
