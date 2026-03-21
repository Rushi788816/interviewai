import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, companyType, difficulty, questions, answers, scores, overallScore } = body as {
      role: string
      companyType: string
      difficulty: string
      questions: unknown
      answers: unknown
      scores: unknown
      overallScore: number
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.credits < 5) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    await prisma.mockSession.create({
      data: {
        userId: session.user.id,
        role,
        companyType,
        difficulty,
        questions: questions as Prisma.InputJsonValue,
        answers: (answers ?? []) as Prisma.InputJsonValue,
        scores: (scores ?? []) as Prisma.InputJsonValue,
        overallScore: overallScore ?? 0,
        completed: true,
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: user.credits - 5 },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('save-mock:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
