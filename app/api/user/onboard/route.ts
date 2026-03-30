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

    const { jobRole, goal } = await req.json() as {
      jobRole?: string
      goal?: string
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboarded: true,
        ...(jobRole ? { jobRole: jobRole.trim() } : {}),
        ...(goal ? { goal: goal.trim() } : {}),
      },
    })

    return NextResponse.json({ success: true })
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
      select: { onboarded: true, jobRole: true, goal: true },
    })
    return NextResponse.json({
      onboarded: user?.onboarded ?? false,
      jobRole: user?.jobRole ?? null,
      goal: user?.goal ?? null,
    })
  } catch {
    return NextResponse.json({ onboarded: false })
  }
}
