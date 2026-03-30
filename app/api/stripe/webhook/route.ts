import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = headers().get('stripe-signature')

  if (!sig) return Response.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, credits, planId } = session.metadata || {}

    if (!userId || !credits) {
      console.error('Missing metadata in stripe session:', session.id)
      return Response.json({ ok: true })
    }

    const creditCount = parseInt(credits, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditCount } },
      }),
      prisma.payment.create({
        data: {
          userId,
          razorpayId: session.payment_intent as string || session.id,
          amount: session.amount_total || 0,
          credits: creditCount,
          plan: planId || 'unknown',
          status: 'completed',
        },
      }),
    ])

    console.log(`Credited ${creditCount} credits to user ${userId}`)
  }

  return Response.json({ ok: true })
}
