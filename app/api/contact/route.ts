import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }

    // Sanitize all user inputs before using in HTML
    const safeName    = escapeHtml(String(name).slice(0, 200))
    const safeEmail   = escapeHtml(String(email).slice(0, 200))
    const safeSubject = escapeHtml(String(subject ?? 'General Inquiry').slice(0, 300))
    const safeMessage = escapeHtml(String(message).slice(0, 5000))

    // Always log to server console
    console.log('[CONTACT]', JSON.stringify({ name: safeName, email: safeEmail, subject: safeSubject, at: new Date().toISOString() }))

    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const toEmail  = process.env.CONTACT_TO_EMAIL ?? smtpUser

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: process.env.SMTP_PORT !== '587',
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: `"InterviewAI Contact" <${smtpUser}>`,
        to: toEmail,
        replyTo: `"${safeName}" <${safeEmail}>`,
        subject: `[Contact] ${safeSubject} — from ${safeName}`,
        text: `Name: ${safeName}\nEmail: ${safeEmail}\nSubject: ${safeSubject}\n\n${safeMessage}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px">
            <h2 style="color:#6366F1">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:4px 0;color:#888">Name</td><td style="padding:4px 8px"><strong>${safeName}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#888">Email</td><td style="padding:4px 8px"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              <tr><td style="padding:4px 0;color:#888">Subject</td><td style="padding:4px 8px">${safeSubject}</td></tr>
            </table>
            <hr style="margin:16px 0;border-color:#eee"/>
            <p style="white-space:pre-wrap;color:#333">${safeMessage}</p>
          </div>
        `,
      })

      console.log('[CONTACT] email sent to', toEmail)
    } else {
      console.warn('[CONTACT] SMTP not configured — message logged only.')
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[CONTACT] error:', msg)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
