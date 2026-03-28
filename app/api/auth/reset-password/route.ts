import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token?.trim() || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Look up the reset token record stored by forgot-password route
    const resetSession = await prisma.session.findUnique({
      where: { token: `reset_${token.trim()}` },
    })

    if (!resetSession) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (resetSession.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token: `reset_${token.trim()}` } })
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetSession.userId },
        data: { password: hashed },
      }),
      prisma.session.delete({
        where: { token: `reset_${token.trim()}` },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[RESET PASSWORD] error:', err?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
