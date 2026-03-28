import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    // Always respond with success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate a secure reset token valid for 1 hour
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in Session table (reuse existing table as a lightweight reset token store)
    await prisma.session.upsert({
      where: { token: `reset_${normalizedEmail}` },
      update: { token: `reset_${normalizedEmail}`, expiresAt: expires, userId: user.id },
      create: { token: `reset_${normalizedEmail}`, expiresAt: expires, userId: user.id },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

    // Send email if SMTP configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: process.env.SMTP_PORT !== '587',
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: `"InterviewAI" <${smtpUser}>`,
        to: normalizedEmail,
        subject: 'Reset your InterviewAI password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#F7931A">Reset your password</h2>
            <p>You requested a password reset for your InterviewAI account.</p>
            <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}"
               style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(135deg,#F7931A,#FF6B2B);color:white;text-decoration:none;border-radius:12px;font-weight:bold">
              Reset Password →
            </a>
            <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    } else {
      // Log for dev — remove in production
      console.log('[FORGOT PASSWORD] Reset link (SMTP not configured):', resetUrl)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[FORGOT PASSWORD] error:', err?.message)
    // Still return success to prevent enumeration
    return NextResponse.json({ success: true })
  }
}
