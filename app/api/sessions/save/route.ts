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

    const body = await request.json()
    const {
      duration,
      creditsUsed,
      qaHistory,
      language,
      mode,
      isDesiMode,
      transcript,
      jobRole,
      jobDescription,
      resumeText,
      resumeFileName,
    } = body as {
      duration?: number
      creditsUsed?: number
      qaHistory?: unknown
      language?: string
      mode?: string
      isDesiMode?: boolean
      transcript?: unknown
      jobRole?: string
      jobDescription?: string
      resumeText?: string
      resumeFileName?: string
    }

    const use = Math.max(0, creditsUsed ?? 0)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (use > 0 && user.credits < use) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    const created = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        duration: duration ?? 0,
        creditsUsed: use,
        transcript: transcript ?? [],
        qaHistory: qaHistory ?? [],
        language: language ?? 'en-US',
        mode: mode ?? 'technical',
        isDesiMode: Boolean(isDesiMode),
        jobRole: jobRole ?? '',
        jobDescription: jobDescription ?? '',
        resumeText: resumeText ?? '',
        resumeFileName: resumeFileName ?? '',
      },
    })

    if (use > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: user.credits - use },
      })
    }

    return NextResponse.json({ success: true, sessionId: created.id })
  } catch (e) {
    console.error('sessions/save:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
