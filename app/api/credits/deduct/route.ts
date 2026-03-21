import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, reason } = await request.json()

    if (!amount || amount <= 0 || !reason) {
      return NextResponse.json({ error: 'Invalid amount or reason' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.credits < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          remaining: user.credits,
        },
        { status: 402 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: user.credits - amount },
    })

    return NextResponse.json({
      success: true,
      remaining: updated.credits,
    })
  } catch (error) {
    console.error('Credits deduct error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
