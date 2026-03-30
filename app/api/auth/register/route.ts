import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'
import { headers } from 'next/headers'

let bcrypt: any
let prisma: any

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registrations per IP per hour
    const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { name, email, password } = body

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!prisma) prisma = (await import('@/lib/prisma')).prisma
    if (!bcrypt) bcrypt = require('bcryptjs')

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        credits: 30,
        plan: 'free',
      },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
