import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [totalSessions, agg, user, sessionsThisWeek] = await Promise.all([
      prisma.interviewSession.count({ where: { userId } }),
      prisma.interviewSession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.interviewSession.count({
        where: { userId, createdAt: { gte: weekAgo } },
      }),
    ])

    const totalSeconds = agg._sum.duration ?? 0
    const totalMinutes = Math.round(totalSeconds / 60)

    return NextResponse.json({
      totalSessions,
      totalMinutes,
      creditsRemaining: user?.credits ?? 0,
      sessionsThisWeek,
    })
  } catch (e) {
    console.error('sessions/stats:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
