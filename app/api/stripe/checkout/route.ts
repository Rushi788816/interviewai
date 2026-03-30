import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const PLANS = {
  starter: { credits: 50,  amount: 49900,  label: 'Starter — 50 Credits' },   // ₹499
  pro:     { credits: 150, amount: 119900, label: 'Pro — 150 Credits' },       // ₹1199
  elite:   { credits: 400, amount: 249900, label: 'Elite — 400 Credits' },     // ₹2499
} as const

type PlanId = keyof typeof PLANS

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { planId } = await req.json() as { planId: PlanId }
    const plan = PLANS[planId]
    if (!plan) return Response.json({ error: 'Invalid plan' }, { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: plan.label, description: `${plan.credits} InterviewAI credits` },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        planId,
        credits: String(plan.credits),
      },
      success_url: `${baseUrl}/credits?success=1&plan=${planId}`,
      cancel_url: `${baseUrl}/credits?cancelled=1`,
    })

    return Response.json({ url: checkoutSession.url })
  } catch (e) {
    console.error('stripe checkout error:', e)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
