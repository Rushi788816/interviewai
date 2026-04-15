import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

const PLANS = {
  starter: { credits: 50,  amount: 49900 },
  pro:     { credits: 150, amount: 119900 },
  power:   { credits: 400, amount: 249900 },
} as const
type PlanId = keyof typeof PLANS

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { planId } = await req.json() as { planId: PlanId }
    const plan = PLANS[planId]
    if (!plan) return Response.json({ error: 'Invalid plan' }, { status: 400 })
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
    const order = await razorpay.orders.create({
      amount: plan.amount, currency: 'INR',
      notes: { userId: session.user.id, planId, credits: String(plan.credits) },
    })
    return Response.json({ orderId: order.id, amount: plan.amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID })
  } catch (e) {
    console.error('razorpay checkout error:', e)
    return Response.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
