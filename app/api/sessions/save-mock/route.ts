import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    // Credits were already deducted during generate + evaluate steps — just save the record
    await prisma.mockSession.create({
      data: {
        userId: session.user.id,
        role,
        companyType,
        difficulty,
        questions: (questions ?? []) as InputJsonValue,
        answers: (answers ?? []) as InputJsonValue,
        scores: (scores ?? []) as InputJsonValue,
        overallScore: overallScore ?? 0,
        completed: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('save-mock:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
