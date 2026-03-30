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

    const { data } = await req.json() as { data: unknown }
    if (!data) return NextResponse.json({ error: 'No data' }, { status: 400 })

    await prisma.userResume.upsert({
      where: { userId: session.user.id },
      update: { data: data as object },
      create: { userId: session.user.id, data: data as object },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('resume/save error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
