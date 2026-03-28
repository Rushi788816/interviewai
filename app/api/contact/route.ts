import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
    }

    // Log to server console so the team can see submissions until an email service is added
    console.log('[CONTACT FORM]', JSON.stringify({ name, email, subject, message, at: new Date().toISOString() }))

    // ── Optional: send via Nodemailer / Resend / EmailJS when ready ──────────
    // Example with Resend (npm i resend):
    // const { Resend } = await import('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@interviewai.app',
    //   to: 'support@interviewai.app',
    //   subject: `[Contact] ${subject} — from ${name}`,
    //   text: `From: ${name} <${email}>\n\n${message}`,
    // })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[CONTACT] error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
