import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
const PLAN_CREDITS: Record<string, number> = { starter: 50, pro: 150, power: 400 }

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json()
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')
    if (expectedSignature !== razorpay_signature) return Response.json({ error: 'Invalid payment signature' }, { status: 400 })
    const credits = PLAN_CREDITS[planId] ?? 0
    if (!credits) return Response.json({ error: 'Invalid plan' }, { status: 400 })
    await prisma.user.update({ where: { id: session.user.id }, data: { credits: { increment: credits } } })
    return Response.json({ success: true, credits })
  } catch (e) {
    console.error('razorpay verify error:', e)
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
