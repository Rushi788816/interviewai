import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }

    // Always log to server console
    console.log('[CONTACT]', JSON.stringify({ name, email, subject, message, at: new Date().toISOString() }))

    // Send email if SMTP credentials are configured
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
        replyTo: `"${name}" <${email}>`,
        subject: `[Contact] ${subject ?? 'General Inquiry'} — from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px">
            <h2 style="color:#F7931A">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:4px 0;color:#888">Name</td><td style="padding:4px 8px"><strong>${name}</strong></td></tr>
              <tr><td style="padding:4px 0;color:#888">Email</td><td style="padding:4px 8px"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:4px 0;color:#888">Subject</td><td style="padding:4px 8px">${subject ?? 'General Inquiry'}</td></tr>
            </table>
            <hr style="margin:16px 0;border-color:#eee"/>
            <p style="white-space:pre-wrap;color:#333">${message}</p>
          </div>
        `,
      })

      console.log('[CONTACT] email sent to', toEmail)
    } else {
      console.warn('[CONTACT] SMTP not configured — message logged only. Add SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL to .env.local to enable email delivery.')
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[CONTACT] error:', err?.message)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
