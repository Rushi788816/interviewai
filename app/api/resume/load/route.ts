import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ data: null })
    }

    const resume = await prisma.userResume.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ data: resume?.data ?? null })
  } catch (e) {
    console.error('resume/load error:', e)
    return NextResponse.json({ data: null })
  }
}
