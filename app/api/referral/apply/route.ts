import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { referralCode } = await req.json()
    if (!referralCode) return Response.json({ error: 'No code provided' }, { status: 400 })
    const currentUser = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    if (!currentUser) return Response.json({ error: 'User not found' }, { status: 404 })
    if ((currentUser as any).referredBy) return Response.json({ error: 'Already used a referral code' }, { status: 400 })
    const referrer = await (prisma.user as any).findFirst({ where: { referralCode } })
    if (!referrer) return Response.json({ error: 'Invalid referral code' }, { status: 404 })
    if (referrer.id === (session.user as any).id) return Response.json({ error: 'Cannot use your own code' }, { status: 400 })
    await prisma.$transaction([
      prisma.user.update({ where: { id: (session.user as any).id }, data: { credits: { increment: 20 }, referredBy: referralCode } as any }),
      prisma.user.update({ where: { id: referrer.id }, data: { credits: { increment: 20 }, referralCount: { increment: 1 } } as any }),
    ])
    return Response.json({ success: true, creditsAdded: 20 })
  } catch (e) {
    console.error('referral error:', e)
    return Response.json({ error: 'Failed to apply referral' }, { status: 500 })
  }
}
