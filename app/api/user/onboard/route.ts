import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobRole, targetCompany } = await req.json() as {
      jobRole?: string
      targetCompany?: string
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboarded: true,
        ...(jobRole ? { name: session.user.name || undefined } : {}),
      },
    })

    // Store preferences in a simple way — just mark onboarded
    // jobRole and targetCompany will be used in the interview session
    return NextResponse.json({ success: true, jobRole, targetCompany })
  } catch (e) {
    console.error('onboard error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ onboarded: false })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboarded: true },
    })
    return NextResponse.json({ onboarded: user?.onboarded ?? false })
  } catch {
    return NextResponse.json({ onboarded: false })
  }
}
